// const url='https://backend-lddr.onrender.com';
// const url='http://localhost:3000';
const url='https://kupa-python-server.onrender.com';

fetch(url)
  .then(response => response.text())
  .then(data => {
    console.log(data); // Display the response from the server
  });

  
  fetch(url+'/collections')
  .then(response => response.json())
  .then(data => {
    // console.log(data);
    
  })
  .catch(error => {
    console.error('Error:', error);
  });


  function fetchData(searchTerm) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url+`/search?q=${searchTerm}`);
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
    });
}

// Function to handle form submission
function handleSubmit(event) {
  event.preventDefault();
  console.log("clickkk");
  const searchTerm = document.getElementById('search-input').value;
  fetchData(searchTerm)
    .then(data => {
      if (Object.keys(data).length > 0) {
        console.log(data);
        const resultCount = Object.keys(data).length;
        getVideo(data);
        const resultCountElement = document.getElementById('resultCount');
        resultCountElement.textContent = `מצאנו ${resultCount} תוצאות אבל זו התוצאה המתאימה ביותר!`;
      } else {
        const resultCountElement = document.getElementById('resultCount');
        resultCountElement.textContent = 'שומו שמיים לא נמצאו תוצאות';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      const resultCountElement = document.getElementById('resultCount');
      resultCountElement.textContent = 'שגיאה בביצוע הבקשה.';
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
      titleElement.textContent = item.context; // Set the title from item.context

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


