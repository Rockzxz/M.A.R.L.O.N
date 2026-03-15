from datetime import date, timedelta

from rest_framework import serializers
from .models import Book, Borrowing, History

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Book title cannot be blank.")
        return value

class BorrowingSerializer(serializers.ModelSerializer):
    
    overdue_days = serializers.ReadOnlyField()
    
 
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = Borrowing
        fields = '__all__'

    def validate(self, attrs):
        """
        Custom borrowing validation:
        - Ensure the selected book has at least one available copy.
        - Prevent double-booking when there are no remaining copies.
        - Ensure due_date is not earlier than borrow_date (if both are provided).
        """
        book = attrs.get('book') or getattr(self.instance, 'book', None)
        borrow_date = attrs.get('borrow_date') or getattr(self.instance, 'borrow_date', date.today())
        due_date = attrs.get('due_date') or getattr(self.instance, 'due_date', None)

        if book:
            # No copies left to borrow
            if book.copies_available <= 0:
                raise serializers.ValidationError(
                    {"book": "No available copies for this book. It is fully borrowed or reserved."}
                )

        if borrow_date and due_date and due_date < borrow_date:
            raise serializers.ValidationError(
                {"due_date": "Due date cannot be earlier than the borrow date."}
            )

        return attrs

    def create(self, validated_data):
        """
        Create a Borrowing record while:
        - Automatically setting a due_date when not provided (14 days after borrow_date).
        NOTE: Book inventory, status changes, and history logging are handled
        in the view layer (BorrowingViewSet.create).
        """
        # Ensure borrow_date exists
        borrow_date = validated_data.get('borrow_date') or date.today()
        validated_data['borrow_date'] = borrow_date

        # Auto-calculate due_date if missing
        if not validated_data.get('due_date'):
            validated_data['due_date'] = borrow_date + timedelta(days=14)

        return super().create(validated_data)

class HistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = '__all__'