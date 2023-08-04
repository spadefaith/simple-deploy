let Queue;

module.exports = async function QueueService() {
  if (!Queue) {
    const im = await import("queue");
    Queue = im.default;
  }

  const q = new Queue({ results: [] });

  q.addEventListener("success", (e) => {
    console.log(
      "job finished processing:",
      e.detail.toString().replace(/\n/g, "")
    );
    console.log("The result is:", e.detail.result);
  });

  return q;
}
