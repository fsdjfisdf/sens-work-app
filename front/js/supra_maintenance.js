document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('checklistForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const data = {};
  
      formData.forEach((value, key) => {
        data[key] = value === 'O' ? 100 : 'X';
      });
  
      try {
        const response = await axios.post('http://your-server-url/supra-maintenance', data, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        if (response.status === 201) {
          alert('Checklist saved successfully.');
        } else {
          alert('Error saving checklist.');
        }
      } catch (error) {
        console.error(error);
        alert('Error saving checklist.');
      }
    });
  
    const signOutButton = document.querySelector("#sign-out");
    if (signOutButton) {
      signOutButton.addEventListener("click", function() {
        localStorage.removeItem("x-access-token");
        alert("Logged out successfully.");
        window.location.replace("./signin.html");
      });
    }
  });
  