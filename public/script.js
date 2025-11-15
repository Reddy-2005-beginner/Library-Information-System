document.addEventListener('DOMContentLoaded', async function () {
  const user = JSON.parse(localStorage.getItem('user'));
  const booksContainer = document.getElementById('booksContainer');

  // ✅ Check login before loading books
  if (!user) {
    alert("Please login to view and borrow books.");
    window.location.href = "index.html";
    return;
  }

  // ✅ Fetch books from backend
  try {
    const res = await fetch('http://localhost:5000/api/books');
    const books = await res.json();

    // ✅ Create book table dynamically
    booksContainer.innerHTML = `
      <table border="1" cellpadding="10" cellspacing="0">
        <thead>
          <tr>
            <th>Serial No</th>
            <th>Book Title</th>
            <th>Author</th>
            <th>Copies</th>
            <th>ISBN</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${books
            .map(
              (book) => `
            <tr>
              <td>${book.serial_number}</td>
              <td>${book.book_title}</td>
              <td>${book.author}</td>
              <td>${book.copies}</td>
              <td>${book.isbn_number}</td>
              <td>${book.status}</td>
              <td>
                ${
                  book.status.toLowerCase() === 'available'
                    ? `<button class="borrow-btn" 
                        data-id="${book.serial_number}" 
                        data-title="${book.book_title}">
                        Borrow
                      </button>`
                    : `<span style="color:red;">Not Available</span>`
                }
              </td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;

    // ✅ Add Borrow button click handlers
    document.querySelectorAll('.borrow-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const bookId = this.getAttribute('data-id');
        const bookTitle = this.getAttribute('data-title');
        openBorrowForm(bookId, bookTitle);
      });
    });
  } catch (err) {
    console.error(err);
    alert('Error fetching books from server.');
  }
});


// ✅ Borrow form popup (asks for dates)
function openBorrowForm(bookId, bookTitle) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    alert("Please login to borrow books.");
    return;
  }

  // Create form dynamically
  const formHtml = `
    <div id="borrowPopup" 
      style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
             background: blueviolet; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px gray; z-index: 1000;">
      <h3>Borrow Book</h3>
      <p><strong>Book:</strong> ${bookTitle}</p>
      <p><strong>Name:</strong> ${user.full_name}</p>
      <label>Borrow Date: <input type="date" id="borrowDate" required></label><br><br>
      <label>Return Date: <input type="date" id="returnDate" required></label><br><br>
      <button id="confirmBorrow">Borrow</button>
      <button id="cancelBorrow">Cancel</button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', formHtml);

  // Button handlers
  document.getElementById('cancelBorrow').onclick = () => {
    document.getElementById('borrowPopup').remove();
  };

  document.getElementById('confirmBorrow').onclick = async () => {
    const borrowDate = document.getElementById('borrowDate').value;
    const returnDate = document.getElementById('returnDate').value;

    if (!borrowDate || !returnDate) {
      alert("Please select both borrow and return dates.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,bookId
        }),
      });

      const data = await res.json();
      alert(data.message);
      document.getElementById('borrowPopup').remove();
    } catch (err) {
      console.error(err)
      alert('Error connecting to server.');
    }
  };
}
