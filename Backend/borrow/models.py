from django.db import models
from datetime import date

# 1. Books Table
class Book(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Borrowed', 'Borrowed'),
        ('Reserved', 'Reserved'),
    ]

    
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=13, unique=True, null=True, blank=True)
    genre = models.CharField(max_length=50, null=True, blank=True)
    year_published = models.PositiveIntegerField(null=True, blank=True)
    
    
    copies_available = models.PositiveIntegerField(default=1)
    copies_borrowed = models.PositiveIntegerField(default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')

    def __str__(self):
        return f"{self.title} by {self.author} ({self.status})"


# 2. Borrowing Table
class Borrowing(models.Model):

    borrower_name = models.CharField(max_length=100)
    borrower_contact_number = models.CharField(max_length=15)
    borrower_email_address = models.EmailField()
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrowings')
    
   
    borrow_date = models.DateField(default=date.today)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Transaction #{self.id}: {self.borrower_name} borrowed '{self.book.title}'"

   
    @property
    def overdue_days(self):
        if self.return_date:
            delta = self.return_date - self.due_date
            return max(0, delta.days)
        else:
            today = date.today()
            delta = today - self.due_date
            return max(0, delta.days)


# 3. History Table
class History(models.Model):
    transaction = models.ForeignKey(Borrowing, on_delete=models.CASCADE, related_name='history_logs')
    
    borrow_date = models.DateField()
    return_date = models.DateField()

    def __str__(self):
        return f"History Log for Transaction #{self.transaction.id}"