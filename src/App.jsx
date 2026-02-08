
import { useState, useEffect } from 'react'
import './App.css'
import { fetchDomains, saveLink, addDomain } from './services/api'
import Login from './components/Login'
import LiveTraffic from './components/LiveTraffic'
import Reports from './components/Reports'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState('generator')

  // Generator State
  const [targetUrls, setTargetUrls] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [judul, setJudul] = useState('')
  const [jumlah, setJumlah] = useState(1)
  const [deskripsi, setDeskripsi] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [blockIndonesia, setBlockIndonesia] = useState(false)

  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')

  const [output, setOutput] = useState([])
  const [imageError, setImageError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // History State
  const [history, setHistory] = useState([])

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsLoggedIn(true)
    }
    setCheckingAuth(false)
  }, [])

  // Load History from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('link_history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const loadDomains = async () => {
    try {
      const data = await fetchDomains()
      if (data.domains && data.domains.length > 0) {
        setDomains(data.domains)
        // Only set selected if not already set, or if current selection is invalid
        if (!selectedDomain || !data.domains.includes(selectedDomain)) {
          setSelectedDomain(data.domains[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err)
    }
  }

  // Fetch domains on mount
  useEffect(() => {
    loadDomains()
  }, [])

  const handleAddDomain = async () => {
    const newDomain = prompt('Masukkan domain baru (contoh: mylink.com):')
    if (!newDomain) return

    try {
      const result = await addDomain(newDomain)
      if (result.success) {
        alert('Domain berhasil ditambahkan!')
        await loadDomains()
        setSelectedDomain(result.domain)
      } else {
        alert(result.message || 'Gagal menambahkan domain')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  useEffect(() => {
    setImageError(false)
  }, [imageUrl])

  // Generate random slug
  const generateRandomSlug = (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let slug = ''
    for (let i = 0; i < length; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return slug
  }

  const addToHistory = (links) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      title: judul || 'Untitled',
      count: links.length,
      links: links
    }
    const updatedHistory = [newEntry, ...history]
    setHistory(updatedHistory)
    localStorage.setItem('link_history', JSON.stringify(updatedHistory))
  }

  const generateLinks = async () => {
    const urls = targetUrls.split('\n').filter(url => url.trim() !== '')

    if (urls.length === 0) {
      alert('Masukkan minimal satu URL!')
      return
    }

    if (!selectedDomain) {
      alert('Tunggu sebentar, sedang memuat domain...')
      return
    }

    setLoading(true)
    const generated = []
    let totalItems = urls.length * jumlah
    let processCount = 0

    try {
      for (const url of urls) {
        for (let i = 0; i < jumlah; i++) {
          processCount++

          let randomSlug
          if (customSlug && customSlug.trim() !== '') {
            if (totalItems > 1) {
              // If generating multiple, append counter to avoid duplicate slug error
              randomSlug = `${customSlug.trim()}-${processCount}`
            } else {
              randomSlug = customSlug.trim()
            }
          } else {
            randomSlug = generateRandomSlug(16)
          }

          // Pick domain - random or selected
          let domainToUse = selectedDomain
          if (selectedDomain === '__RANDOM__' && domains.length > 0) {
            domainToUse = domains[Math.floor(Math.random() * domains.length)]
          }

          // Auto-detect localhost for testing
          const protocol = domainToUse.includes('localhost') ? 'http' : 'https'
          const generatedLink = `${protocol}://${domainToUse}/${randomSlug}`

          // Save to Database
          await saveLink({
            slug: randomSlug,
            original_url: url,
            domain_url: domainToUse,
            title: judul,
            description: deskripsi,
            image_url: imageUrl,
            block_indonesia: blockIndonesia
          })

          generated.push(generatedLink)
        }
      }

      if (generated.length > 0) {
        setOutput(generated)
        addToHistory(generated)
        // Only clear slug if success to allow rapid regeneration if needed, or clear it?
        // Let's clear custom slug to avoid accidental reuse if user forgets
        if (customSlug) setCustomSlug('')
      }
    } catch (err) {
      console.error('Error generating links:', err)
      alert(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyAll = async () => {
    if (output.length === 0) return
    try {
      await navigator.clipboard.writeText(output.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearOutput = () => {
    setOutput([])
    setCopied(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setIsLoggedIn(false)
  }

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div>
          <h1 className="title">NGE-team</h1>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
        <p className="subtitle">
          Generate multiple secure <span className="highlight">links</span> with custom OG Meta tags in seconds.
        </p>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          Generator
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {activeTab === 'generator' ? (
        <div className="dashboard-grid">
          <main className="main-content">
            {/* Input Card */}
            <div className="card input-card">
              <div className="form-group">
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>DOMAIN</span>
                  <button
                    onClick={handleAddDomain}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f97316',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    + ADD NEW
                  </button>
                </label>
                <select
                  className="select"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  disabled={domains.length === 0}
                >
                  {domains.length > 0 ? (
                    <>
                      <option value="__RANDOM__">🎲 Random Domain</option>
                      {domains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option>Loading domains...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="label">
                  TARGET URLS <span className="label-hint">(ONE PER LINE)</span>
                </label>
                <textarea
                  className="textarea"
                  placeholder="Paste link disini..."
                  rows={4}
                  value={targetUrls}
                  onChange={(e) => setTargetUrls(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">CUSTOM SLUG <span className="label-hint">(OPTIONAL)</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: viral-video-2026"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="label">JUDUL</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Input Judul"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">JUMLAH</label>
                  <input
                    type="number"
                    className="input input-small"
                    value={jumlah}
                    min={1}
                    onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">DESKRIPSI</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Input Deskripsi"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">IMAGE URL</label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="image-preview">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="preview-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <span>Image Preview</span>
                  </div>
                )}
              </div>

              {/* Block Indonesia Toggle */}
              <div className="form-group toggle-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={blockIndonesia}
                    onChange={(e) => setBlockIndonesia(e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">🇮🇩 Block Indonesia</span>
                </label>
              </div>

              <button className="btn-generate" onClick={generateLinks} disabled={loading}>
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                    <span>Generate Links</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Card */}
            <div className="card output-card">
              <label className="label">GENERATED OUTPUT</label>
              <div className="output-area">
                {output.length > 0 ? (
                  output.map((link, index) => (
                    <div key={index} className="output-link">{link}</div>
                  ))
                ) : (
                  <div className="output-placeholder">
                    <span>Hasil generation akan muncul disini</span>
                  </div>
                )}
              </div>
              <div className="output-actions">
                <button className="btn-copy" onClick={copyAll} disabled={output.length === 0}>
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      <span>Copy All</span>
                    </>
                  )}
                </button>
                <button className="btn-clear" onClick={clearOutput}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </main>

          {/* Sidebar with LiveTraffic */}
          <aside className="sidebar">
            <LiveTraffic />
          </aside>
        </div>
      ) : activeTab === 'reports' ? (
        <main className="main-content single-col">
          <Reports />
        </main>
      ) : (
        <main className="main-content single-col">
          <div className="card">
            <div className="history-list">
              {history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-info">
                      <strong>{item.title}</strong>
                      <small>{item.count} links generated</small>
                    </div>
                    <span className="history-date">{item.date}</span>
                    <button
                      className="btn-copy"
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
                      onClick={() => {
                        setOutput(item.links)
                        setActiveTab('generator')
                      }}
                    >
                      Load
                    </button>
                  </div>
                ))
              ) : (
                <div className="output-placeholder" style={{ padding: '40px' }}>
                  <span>Belum ada history generation.</span>
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

export default App
