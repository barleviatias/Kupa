// const url='https://backend-lddr.onrender.com';
// const url='http://localhost:3000';
// const url='https://kupa-python-server.onrender.com';
const url='http://127.0.0.1:5000';

fetch(url)
  .then(response => response.text())
  .then(data => {
    console.log(data); // Display the response from the server
  });

  
  fetch(url+'/counter')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    const elCounter = document.getElementById('counter');
    elCounter.textContent = `בוסגה בוצעו עד עכשיו ${data.counter} חיפושים`;
    
  })
  .catch(error => {
    console.error('Error:', error);
  });

  function showLoader() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
  }
  
  function hideLoader() {
    const loader = document.getElementById('loader');
    loader.style.display = 'none';
  }
  function fetchData(searchTerm) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const ipAddressUrl = 'https://api.ipify.org?format=json';

        // Fetch the client's IP address
        fetch(ipAddressUrl)
            .then((response) => response.json())
            .then((data) => {
                const ipAddress = data.ip;

                // Open the XHR request with the IP address and search term in the headers
                xhr.open('GET', url + `/search?q=${searchTerm}`);
                xhr.setRequestHeader('X-Search-IP', ipAddress);

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } else {
                            reject(new Error('Request failed'));
                        }
                    }
                };

                xhr.send();
            })
            .catch((error) => {
                reject(error);
            });
    });
}

// Function to handle form submission
function handleSubmit(event) {
  event.preventDefault();
  showLoader();
  console.log("clickkk");
  const searchTerm = document.getElementById('search-input').value;
  fetchData(searchTerm)
    .then(data => {
      if (Object.keys(data).length > 0) {
        console.log(data);
        const resultCount = Object.keys(data).length;
        getVideo(data);
        const resultCountElement = document.getElementById('resultCount');
        resultCountElement.textContent = `בוסגה מצאנו  ${resultCount} תוצאות!`;
        resultCountElement.style.visibility='visible';
      } else {
        const resultCountElement = document.getElementById('resultCount');
        resultCountElement.textContent = 'שומו שמיים לא נמצאו תוצאות';
      }
      hideLoader();
    })
    .catch(error => {
      console.error('Error:', error);
      const resultCountElement = document.getElementById('resultCount');
      resultCountElement.textContent = 'שגיאה בביצוע הבקשה.';
      hideLoader();
    });
}

// Add event listener to the form submit button
const form = document.querySelector('#search-form');
console.log(form);
form.addEventListener('submit', handleSubmit);




// Replace 'YOUR_API_KEY' with your actual YouTube API key
function getVideo(data) {
  const videosContainer = document.getElementById('videosContainer');
  videosContainer.innerHTML = ''; // Clear previous results

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const item = data[key];
      console.log(item.episode_name);

      // Create a <div> element to wrap the iframe
      const videoWrapper = document.createElement('div');
      videoWrapper.classList.add('video-wrapper');

       // Create a <div> element to wrap the iframe
       const videoFrame = document.createElement('div');
       videoWrapper.classList.add('video-frame');
      // Create a <h2> element for the title
      const titleElement = document.createElement('p');
      titleElement.classList.add('context');
      titleElement.textContent = '"'+item.context+'"'; // Set the title from item.context

      // Create an <iframe> element with the video player
      const iframe = document.createElement('iframe');
      const video_id = item.url.split('watch?v=')[1];
      iframe.src = `https://www.youtube.com/embed/${video_id}`;
      iframe.width = '100%';
      iframe.height = '100%';

      // Append the title element to the video wrapper
      // Append the <iframe> element to the video wrapper
      videoWrapper.appendChild(iframe);
      
      // Append the video wrapper to the videos container
      videoFrame.appendChild(videoWrapper);
      videoFrame.appendChild(titleElement);
      videosContainer.appendChild(videoFrame);
    }
  }
}


