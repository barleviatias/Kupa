const url='https://backend-lddr.onrender.com';

fetch(url)
  .then(response => response.text())
  .then(data => {
    console.log(data); // Display the response from the server
  });

  fetch(url+'/collections')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    
  })
  .catch(error => {
    console.error('Error:', error);
  });


  function fetchData(searchTerm) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url+`/query?searchTerm=${searchTerm}`);
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
            // Process and display the data
            console.log(data);
            const resultCount = data.length;
            getVideo(data)
            const resultCountElement = document.getElementById('resultCount');
            resultCountElement.textContent = ` מצאנו ${resultCount} תוצאות  `;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Add event listener to the form submit button
const form = document.querySelector('#search-form');
console.log(form);
form.addEventListener('submit', handleSubmit);




// Replace 'YOUR_API_KEY' with your actual YouTube API key
const apiKey = 'AIzaSyAfvktGRnTPT-aq4CfjmM3zi1jWHxqojY4';
function getVideo(lst){
  const videosContainer = document.getElementById('videosContainer');
  videosContainer.innerHTML = ''; // Clear previous results
  for (item of lst){
    console.log(item.title);
    }
    // Make an HTTP GET request to the YouTube Data API
//     fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&q=${item.title}&maxResults=1&type=video`)
//     .then(response => response.json())
//     .then(data => {
      
//         const videos = data.items;
    
//         if (videos.length === 0) {
//             videosContainer.textContent = 'No videos found.';
//             return;
//     }
  
//     videos.forEach(video => {
//       const { id: { videoId }, snippet: { title } } = video;
  
//       // Create a <div> element to wrap the iframe
//       const videoWrapper = document.createElement('div');
//       videoWrapper.classList.add('video-wrapper');

//       // Create an <iframe> element with the video player
//       const iframe = document.createElement('iframe');
//       iframe.src = `https://www.youtube.com/embed/${videoId}`;
//       iframe.width = '100%';
//       iframe.height = '100%';

//       // Append the <iframe> element to the video wrapper
//       videoWrapper.appendChild(iframe);

//       // Append the video wrapper to the videos container
//       videosContainer.appendChild(videoWrapper);
//     });
//   })
//   .catch(error => console.error('Error:', error));
// }
  
}