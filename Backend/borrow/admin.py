from django.contrib import admin
from .models import Book, BorrowRecord

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'isbn')
    list_filter = ('status',)
    search_fields = ('title', 'author', 'isbn')

@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'borrow_date', 'due_date', 'return_date', 'overdue_days')
    list_filter = ('return_date', 'due_date')
    search_fields = ('user__username', 'book__title')