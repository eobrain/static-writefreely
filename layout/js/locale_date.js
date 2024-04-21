document.querySelectorAll('time').forEach($time => {
  $time.innerText = new Date($time.innerText).toLocaleDateString()
})
