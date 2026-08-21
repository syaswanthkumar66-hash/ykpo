const submitIndexNow = async () => {
  const payload = {
    "host": "ykyash.in",
    "key": "ae57ce385ecd4e26bbced6e16f93a4a6",
    "keyLocation": "https://ykyash.in/ae57ce385ecd4e26bbced6e16f93a4a6.txt",
    "urlList": [
        "https://ykyash.in/",
        "https://ykyash.in/home"
    ]
  };

  try {
    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error);
  }
};

submitIndexNow();
