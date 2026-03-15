from datetime import date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Book, Borrowing, History
from .serializers import BookSerializer, BorrowingSerializer, HistorySerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class BorrowingViewSet(viewsets.ModelViewSet):
    queryset = Borrowing.objects.all()
    serializer_class = BorrowingSerializer

    # ==========================================
    # 1. BORROWING LOGIC (Overrides standard POST)
    # ==========================================
    def create(self, request, *args, **kwargs):
        """
        Intercepts the creation of a borrowing record to apply business rules.
        """
        book_id = request.data.get('book')
        borrower_email = request.data.get('borrower_email_address')

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "The requested book does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # RULE 1: Validate Availability
        if book.status != 'Available' or book.copies_available <= 0:
            return Response(
                {"error": "This book is currently unavailable for borrowing."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # RULE 2: Prevent Double-Booking (Check if user already has THIS book unreturned)
        active_borrowing = Borrowing.objects.filter(
            book=book, 
            borrower_email_address=borrower_email, 
            return_date__isnull=True
        ).exists()
        
        if active_borrowing:
            return Response(
                {"error": "You already have an active borrowing record for this book."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # RULE 3: Proceed with creating the transaction
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # RULE 4: Update Book Inventory Mathematically
        book.copies_available -= 1
        book.copies_borrowed += 1
        
        if book.copies_available == 0:
            book.status = 'Borrowed'
            
        book.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


    # ==========================================
    # 2. RETURN LOGIC (Custom Endpoint)
    # ==========================================
    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        """
        Custom action to handle returning a borrowed book.
        - Sets the return_date to today.
        - Updates book inventory and status.
        - Updates the related History log.
        - Returns the updated borrowing with recalculated overdue_days.
        """
        borrowing = self.get_object()

        if borrowing.return_date:
            return Response(
                {"detail": "This borrowing has already been returned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use provided return_date if given, otherwise default to today
        return_date_str = request.data.get("return_date")
        if return_date_str:
            try:
                # Expecting ISO format: "YYYY-MM-DD"
                year, month, day = map(int, return_date_str.split("-"))
                borrowing.return_date = date(year, month, day)
            except (TypeError, ValueError):
                return Response(
                    {"return_date": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            borrowing.return_date = date.today()

        # Update the borrowing record
        borrowing.save()

        # Update book inventory and status
        book = borrowing.book
        if book.copies_borrowed > 0:
            book.copies_borrowed -= 1
        book.copies_available += 1
        
        # If we just returned a copy, it is definitely 'Available' now
        book.status = 'Available' 
        book.save()

        # Update or create the history log for this transaction
        History.objects.update_or_create(
            transaction=borrowing,
            defaults={
                "borrow_date": borrowing.borrow_date,
                "return_date": borrowing.return_date,
            },
        )

        serializer = self.get_serializer(borrowing)
        return Response(serializer.data, status=status.HTTP_200_OK)

class HistoryViewSet(viewsets.ModelViewSet):
    queryset = History.objects.all()
    serializer_class = HistorySerializer