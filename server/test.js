async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello pwd' }) 
    });
    const data = await res.text();
    console.log("Data:");
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
run();
