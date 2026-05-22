// Detects common ATS application forms and offers to autofill from the
// latest generated application. Currently supports Greenhouse, Lever, Ashby.

const FIELD_MAP = {
  // Greenhouse / Lever / Ashby share many of these label patterns.
  name: [/full\s*name/i, /^name$/i, /your\s+name/i],
  firstName: [/first\s*name/i],
  lastName: [/last\s*name/i],
  email: [/email/i],
  phone: [/phone/i, /mobile/i],
  linkedin: [/linkedin/i],
  github: [/github/i],
  portfolio: [/portfolio|website/i],
  coverLetter: [/cover\s*letter/i, /why.+interested/i, /tell us about/i],
}

let lastApp = null

function detectFields() {
  const fields = []
  for (const input of document.querySelectorAll('input, textarea')) {
    const label = findLabelText(input)
    if (!label) continue
    for (const [key, patterns] of Object.entries(FIELD_MAP)) {
      if (patterns.some((re) => re.test(label))) {
        fields.push({ key, el: input, label })
        break
      }
    }
  }
  return fields
}

function findLabelText(el) {
  if (el.labels && el.labels.length) return el.labels[0].innerText
  if (el.placeholder) return el.placeholder
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label')
  const parent = el.closest('label, .form-field, .field')
  return parent?.innerText ?? ''
}

function fillField(el, value) {
  if (!value) return
  const proto = Object.getPrototypeOf(el)
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function injectButton() {
  if (document.getElementById('aija-autofill-btn')) return
  const btn = document.createElement('button')
  btn.id = 'aija-autofill-btn'
  btn.textContent = '⚡ Autofill with AI Job Agent'
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    background: '#6d28d9',
    color: '#fff',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  })
  btn.addEventListener('click', autofill)
  document.body.appendChild(btn)
}

async function autofill() {
  if (!lastApp) {
    const res = await chrome.runtime.sendMessage({ type: 'GET_LATEST_APPLICATION' })
    if (!res?.ok) {
      alert(`Could not load latest application: ${res?.error ?? 'unknown'}`)
      return
    }
    lastApp = res.data
  }
  const fields = detectFields()
  const values = {
    name: lastApp.resume?.name,
    firstName: lastApp.resume?.name?.split(' ')[0],
    lastName: lastApp.resume?.name?.split(' ').slice(1).join(' '),
    email: lastApp.resume?.email,
    phone: lastApp.resume?.phone,
    linkedin: lastApp.resume?.links?.find((l) => /linkedin/i.test(l)),
    github: lastApp.resume?.links?.find((l) => /github/i.test(l)),
    portfolio: lastApp.resume?.links?.find(
      (l) => !/linkedin|github/i.test(l),
    ),
    coverLetter: lastApp.application?.coverLetter,
  }
  let filled = 0
  for (const f of fields) {
    if (values[f.key]) {
      fillField(f.el, values[f.key])
      filled += 1
    }
  }
  const note = document.createElement('div')
  Object.assign(note.style, {
    position: 'fixed',
    bottom: '70px',
    right: '20px',
    background: '#16a34a',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    zIndex: '999999',
  })
  note.textContent = `Filled ${filled} of ${fields.length} detected fields.`
  document.body.appendChild(note)
  setTimeout(() => note.remove(), 4000)
}

if (detectFields().length > 0) {
  injectButton()
}
