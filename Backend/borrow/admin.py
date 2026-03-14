from django.contrib import admin
from .models import Book, Borrowing, History

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'isbn', 'copies_available')
    list_filter = ('status', 'genre')
    search_fields = ('title', 'author', 'isbn')

@admin.register(Borrowing)
class BorrowingAdmin(admin.ModelAdmin):
    list_display = ('id', 'borrower_name', 'book', 'borrow_date', 'due_date', 'return_date', 'overdue_days')
    list_filter = ('return_date', 'due_date')
    search_fields = ('borrower_name', 'book__title', 'borrower_email_address')

@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'borrow_date', 'return_date')