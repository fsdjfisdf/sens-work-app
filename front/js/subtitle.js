// subtitle.js

document.getElementById('titleForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const title = document.getElementById('title').value;
    const reason = document.getElementById('reason').value;

    try {
        const response = await fetch('/api/save-title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                title: title,
                reason: reason,
            }),
        });

        const result = await response.json();
        const responseMessage = document.getElementById('responseMessage');

        if (result.success) {
            responseMessage.textContent = 'Title submitted successfully!';
            responseMessage.style.color = 'green';
            document.getElementById('titleForm').reset();
        } else {
            responseMessage.textContent = 'Failed to submit title.';
            responseMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('responseMessage').textContent = 'An error occurred. Please try again.';
        document.getElementById('responseMessage').style.color = 'red';
    }
});
