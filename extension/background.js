const DEFAULT_API = 'http://localhost:3000'

chrome.runtime.onInstalled.addListener(async () => {
  const { apiBaseUrl } = await chrome.storage.local.get('apiBaseUrl')
  if (!apiBaseUrl) {
    await chrome.storage.local.set({ apiBaseUrl: DEFAULT_API })
  }
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_LATEST_APPLICATION') {
    fetchLatestApplication()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }
})

async function fetchLatestApplication() {
  const { apiBaseUrl } = await chrome.storage.local.get('apiBaseUrl')
  const res = await fetch(`${apiBaseUrl ?? DEFAULT_API}/api/applications/latest`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.json()
}
