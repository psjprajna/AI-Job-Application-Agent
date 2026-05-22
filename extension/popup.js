const apiInput = document.getElementById('api')
const saveBtn = document.getElementById('save')
const status = document.getElementById('status')

;(async () => {
  const { apiBaseUrl } = await chrome.storage.local.get('apiBaseUrl')
  apiInput.value = apiBaseUrl ?? 'http://localhost:3000'
})()

saveBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ apiBaseUrl: apiInput.value.trim() })
  status.textContent = 'Saved.'
  setTimeout(() => (status.textContent = ''), 1500)
})
