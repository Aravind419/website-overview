document.addEventListener('DOMContentLoaded', () => {
    // Use the deployed backend URL
    const API_URL = 'https://your-backend-url.onrender.com'; // Replace with your actual backend URL

    const urlInput = document.getElementById('urlInput');
    const getOverviewButton = document.getElementById('getOverview');
    const errorMessage = document.getElementById('errorMessage');
    const spinner = document.getElementById('spinner');
    const overviewSection = document.getElementById('overviewSection');

    getOverviewButton.addEventListener('click', async () => {
        let url = urlInput.value.trim();
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        errorMessage.textContent = '';
        spinner.style.display = 'flex';
        overviewSection.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            // Rest of your existing code...
        }
    });
    // Rest of your existing code...
}); 