import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useMemo } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  Textarea, Modal, Box, SegmentedControl,
  Loader, ScrollArea, CopyButton, TextInput, Select, Pagination, Tooltip
} from '@mantine/core'
import { 
  AiOutlineCheck, AiOutlineDelete, AiOutlineMessage, 
  AiOutlineClockCircle, AiOutlineGlobal, AiOutlineLock, 
  AiOutlineEnvironment, AiOutlineEye, AiOutlineCopy, 
  AiOutlineSearch, AiOutlineCheckCircle, AiOutlineWarning
} from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'
const ITEMS_PER_PAGE = 15

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // MAIN WORKSPACE SECTION: 'spots' | 'contact' | 'comments'
  const [activeSection, setActiveSection] = useState('comments')

  // COMMENTS STATE
  const [comments, setComments] = useState<any[]>([])
  const [commentSubFilter, setCommentSubFilter] = useState<'pending' | 'approved' | 'flagged' | 'all'>('pending')
  const [commentSearch, setCommentSearch] = useState('')
  const [selectedPostFilter, setSelectedPostFilter] = useState<string | null>('all')
  const [commentPage, setCommentPage] = useState(1)

  // SUBMISSIONS STATE
  const [submissions, setSubmissions] = useState<any[]>([])
  const [subFilter, setSubFilter] = useState('pending')
  const [subLoading, setSubLoading] = useState(false)
  const [activeSub, setActiveSub] = useState<any>(null)
  
  // REPLY MODAL STATE
  const [replyModal, setReplyModal] = useState({ opened: false, parentId: '', pageId: '', pageTitle: '', nickname: '' })
  const [replyContent, setReplyContent] = useState('')

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/public-comments') 
      const data = await res.json()
      if (Array.isArray(data)) setComments(data)
      else if (data.comments) setComments(data.comments)
    } catch (err) { 
      console.error("Fetch comments failed", err)
      setComments([]) 
    }
  }

  const fetchSubmissions = async () => {
    setSubLoading(true)
    try {
      const res = await fetch(`/api/submissions?status=${subFilter}`)
      const data = await res.json()
      setSubmissions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Fetch submissions failed", err)
      setSubmissions([])
    } finally {
      setSubLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchComments()
        fetchSubmissions()
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchSubmissions()
    }
  }, [subFilter])

  // Split submissions into spots and contact messages
  const spotSubmissions = useMemo(() => {
    return submissions.filter(s => s.type === 'spot')
  }, [submissions])

  const contactSubmissions = useMemo(() => {
    return submissions.filter(s => s.type === 'contact')
  }, [submissions])

  // Extract distinct posts for the filter dropdown
  const postOptions = useMemo(() => {
    const map = new Map<string, string>()
    comments.forEach(c => {
      const title = c.Page?.title || 'General / Legacy'
      const slug = c.Page?.slug || title
      if (!map.has(slug)) {
        map.set(slug, title)
      }
    })
    return [
      { value: 'all', label: 'All Posts & Pages' },
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label }))
    ]
  }, [comments])

  // Process and filter comments cleanly
  const { filteredComments, pendingCount, flaggedCount } = useMemo(() => {
    let pending = 0
    let flagged = 0

    const list = comments.filter(c => {
      const isLink = c.content?.toLowerCase().includes('http')
      if (!c.approved && !isLink) pending++
      if (isLink) flagged++

      // Status Filter
      if (commentSubFilter === 'pending' && (c.approved || isLink)) return false
      if (commentSubFilter === 'approved' && !c.approved) return false
      if (commentSubFilter === 'flagged' && !isLink) return false

      // Post Filter
      if (selectedPostFilter && selectedPostFilter !== 'all') {
        const pageSlug = c.Page?.slug || c.Page?.title
        if (pageSlug !== selectedPostFilter) return false
      }

      // Search Query
      if (commentSearch.trim()) {
        const q = commentSearch.toLowerCase()
        const textMatch = c.content?.toLowerCase().includes(q)
        const authorMatch = c.by_nickname?.toLowerCase().includes(q) || c.by_email?.toLowerCase().includes(q)
        const ipMatch = c.ip?.toLowerCase().includes(q)
        const postMatch = c.Page?.title?.toLowerCase().includes(q)
        if (!textMatch && !authorMatch && !ipMatch && !postMatch) return false
      }

      return true
    })

    return { filteredComments: list, pendingCount: pending, flaggedCount: flagged }
  }, [comments, commentSubFilter, selectedPostFilter, commentSearch])

  // Paginated comments slice
  const paginatedComments = useMemo(() => {
    const start = (commentPage - 1) * ITEMS_PER_PAGE
    return filteredComments.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredComments, commentPage])

  const totalPages = Math.ceil(filteredComments.length / ITEMS_PER_PAGE) || 1

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  // BULK APPROVE ALL VISIBLE PENDING
  const handleBulkApprove = async () => {
    const unapproved = comments.filter(c => !c.approved && !c.content?.toLowerCase().includes('http'))
    if (!unapproved.length) return

    if (!window.confirm(`Approve all ${unapproved.length} pending comments at once?`)) return

    const { data: { session } } = await supabase.auth.getSession()
    await Promise.all(
      unapproved.map(c => 
        fetch(`/api/public-comments?id=${c.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ approved: true })
        })
      )
    )
    fetchComments()
  }

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (activeSub && String(activeSub.id) === String(id)) {
        setActiveSub(null)
      }
      fetchSubmissions()
    } catch (err) {
      console.error("Failed to update status", err)
    }
  }

  // BLOGGER POST GENERATOR HELPER
  const generateBloggerHtml = (item: any) => {
    if (!item) return ''
    const details = item.details || {}
    const title = item.title || 'Spot Name'
    const contributorName = item.name || 'Anonymous'
    const suburb = item.suburb ? ` (${item.suburb})` : ''
    const address = details.address || ''
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${address}`.trim())}`
    const website = details.website || ''
    const placeType = details.place_type || 'Place'

    const starMap: Record<string, string> = {
      '5.0': '⭐⭐⭐⭐⭐ 5.0/5.0',
      '4.5': '⭐⭐⭐⭐½ 4.5/5.0',
      '4.0': '⭐⭐⭐⭐ 4.0/5.0',
      '3.5': '⭐⭐⭐½ 3.5/5.0',
      '3.0': '⭐⭐⭐ 3.0/5.0'
    }
    const ratingDisplay = starMap[details.rating] || `${details.rating || '4.0'}/5.0`
    const verdict = details.verdict || ''

    const badgeIcons: Record<string, string> = {
      'All Ages': '👨‍‍👩‍👧‍👦',
      '1-3 Hours': '⏱️',
      'Free Parking': '🅿',
      'Free Entry': '💰',
      'Toilets Onsite': '🚻',
      'Shaded Areas': '🌳',
      'Fully Fenced': '🚪',
      'Accessible': '♿',
      'Coffee / Food': '☕',
      'Playground': '🛝',
      'BBQ Facilities': '🥩',
      'Dog Friendly': '🐶',
      'Toddler Friendly': '👶',
      'Indoor Venue': '🏠'
    }

    let badgesHtml = ''
    const badgesArray = Array.isArray(details.badges) ? details.badges : []
    if (badgesArray.length > 0) {
      badgesArray.forEach((b: string) => {
        const icon = badgeIcons[b] || '✔'
        badgesHtml += `        <div class="summary-item"><span class="summary-icon">${icon}</span><span class="summary-text">${b}</span></div>\n`
      })
    } else {
      badgesHtml = `        <div class="summary-item"><span class="summary-icon">👨‍👩‍👧‍👦</span><span class="summary-text">All Ages</span></div>\n`
    }

    const hours = details.hours || {}
    const monThu = hours.mon_thu || '10:00 AM - 9:00 PM'
    const fri = hours.fri || '10:00 AM - 10:00 PM'
    const sat = hours.sat || '9:00 AM - 10:00 PM'
    const sun = hours.sun || '9:00 AM - 8:00 PM'

    const rawBody = details.review_body || ''
    const bodyParagraphs = rawBody
      .split(/\n\s*\n/)
      .map((p: string) => `        <p>${p.trim()}</p>`)
      .join('\n')

    const proTip = details.pro_tip || ''

    let webMarkup = ''
    if (website) {
      const cleanWeb = website.replace(/^https?:\/\//, '').replace(/\/$/, '')
      webMarkup = `
          <div>
            <span class="meta-label" style="color:#007bff !important; font-size:9px;">Official Website</span>
            <span class="meta-value">
              <a href="${website}" target="_blank">
                <i class="fa fa-globe" style="margin-right: 8px; color: #007bff;"></i>
                ${cleanWeb}
              </a>
            </span>
          </div>`
    }

    return `<style>
/* ============================================
   BEST DAYS WITH DAD - UNIFIED POST TEMPLATE
   ============================================ */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
.post-title-container, .post-header-line-1, .post-header { display: none !important; }
body { background-color: #ffffff; font-family: 'Montserrat', sans-serif !important; }
.container { max-width: 1000px; margin: 0 auto; padding: 0; width: 100%; box-sizing: border-box; }

.post-subtitle { display: block; text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 5px; color: #007bff; margin-top: 40px; }
.post-title { font-size: 3.2rem !important; font-weight: 900 !important; color: #1a202c !important; text-align: center; margin: 10px 10px !important; letter-spacing: -2px !important; text-transform: uppercase !important; line-height: 1; word-break: break-word; }
.title-accent { width: 60px !important; height: 4px !important; background: #c7af76 !important; margin: 15px auto 20px auto !important; border-radius: 2px !important; }

.contributor-attribution {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  padding: 8px 18px;
  width: fit-content;
  max-width: 90%;
  margin: 0 auto 35px auto;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  text-align: center;
}
.contributor-attribution i { color: #007bff; font-size: 14px; flex-shrink: 0; }
.contributor-highlight { color: #0f172a; font-weight: 800; }

.glance-header { text-align: center !important; font-size: 16px !important; text-transform: uppercase !important; letter-spacing: 4px !important; color: #94a3b8 !important; margin: 40px 0 30px 0 !important; display: flex !important; justify-content: center !important; gap: 10px !important; font-weight: 800 !important; }
.summary-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important; gap: 12px !important; margin: 0 10px 40px 10px; }
.summary-item {
  background: #ffffff !important; border: 1px solid #f1f5f9 !important; border-radius: 12px !important;
  padding: 20px 5px !important; text-align: center; transition: all 0.4s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-width: 0;
}
.summary-item:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1); border-color: #007bff !important; }
.summary-icon { font-size: 1.8rem !important; margin-bottom: 8px; display: block; }
.summary-text { font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase; color: #64748b; line-height: 1.2; word-break: break-word; }

.best-day-verdict { background: linear-gradient(135deg, #fffdf5 0%, #ffffff 100%) !important; border-radius: 0 15px 15px 0 !important; border: 1px solid #fef3c7 !important; border-left: 8px solid #c7af76 !important; padding: 30px 20px !important; margin: 10px 10px 30px 10px !important; box-shadow: 0 4px 15px rgba(199, 175, 118, 0.1); }
.verdict-header { color: #c7af76 !important; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; font-size: 13px; }
.verdict-summary { color: #1e293b !important; font-size: 1.2rem !important; font-weight: 600; line-height: 1.3; margin-top: 10px; }

.meta-box { border-top: 1px solid #f1f5f9; padding: 40px 15px !important; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; align-items: start; }
.meta-label, .hours-title { color: #94a3b8 !important; font-weight: 700; font-size: 14px !important; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; display: block; }
.meta-value a { font-size: 16px; color: #1a202c !important; font-weight: 700; text-decoration: none; border-bottom: 2px solid rgba(0, 123, 255, 0.1); transition: all 0.3s ease; display: inline-block; word-break: break-word; }
.hours-grid { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.hours-day { display: flex; justify-content: space-between; padding: 10px 15px; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 8px; font-size: 0.85rem; font-weight: 600; gap: 8px; }

.post-content p { font-size: 18px !important; line-height: 1.8; color: #334155 !important; margin: 0 15px 30px 15px; }
.callout-box { background: #ffffff !important; border: 3px solid #f1f5f9 !important; border-left: 6px solid #007bff !important; padding: 25px !important; border-radius: 4px 15px 15px 4px !important; margin: 30px 15px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
.callout-header { margin-bottom: 8px; font-size: 15px; color: #007bff; text-transform: uppercase; letter-spacing: 1px; }
.callout-content { font-size: 16px; color: #334155; line-height: 1.6; }

.comment-disclaimer { margin-top: -35px !important; }

@media (max-width: 850px) {
  .container { width: 100% !important; padding: 0 !important; }
  .meta-box { grid-template-columns: minmax(0, 1fr); gap: 28px; padding: 25px 10px !important; }
  .post-title { font-size: 1.8rem !important; margin: 10px 10px !important; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; margin: 0 8px; }
  .post-subtitle { font-size: 12px !important; }
  .contributor-attribution { font-size: 11px; padding: 6px 14px; }
}
</style>

<div class="container">
  <article class="post">
    <header class="hero-header">
      <span class="post-subtitle">Best Days With Dad - No Nonsense Review</span>
      <h1 class="post-title">${title}</h1>
      <div class="title-accent"></div>

      <div class="contributor-attribution">
        <i class="fa fa-user-check"></i>
        <span>Contributed by <span class="contributor-highlight">${contributorName}${suburb}</span></span>
      </div>
    </header>

    <div class="quick-summary">
      <h3 class="glance-header">📋 At a Glance</h3>
      <div class="summary-grid">
${badgesHtml}      </div>
    </div>

    <div class="best-day-verdict">
      <span class="verdict-header">Best Day Score: ${ratingDisplay}</span>
      <p class="verdict-summary">"${verdict}"</p>
    </div>

    <div class="meta-box">
      <div class="meta-item-left">
        <span class="meta-label">Visit Details</span>
        <div style="margin-bottom: 25px;">
          <span class="meta-label" style="color:#007bff !important; font-size:9px;">Location</span>
          <span class="meta-value">
            <a href="${mapsUrl}" target="_blank">
              <i class="fa fa-map-marker" style="margin-right: 8px; color: #007bff;"></i>
              ${address}
            </a>
          </span>
        </div>${webMarkup}
      </div>

      <div class="meta-item-right">
        <span class="hours-title">Hours / Schedule</span>
        <div class="hours-grid">
          <div class="hours-day"><span>Mon - Thu:</span><span>${monThu}</span></div>
          <div class="hours-day"><span>Friday:</span><span>${fri}</span></div>
          <div class="hours-day"><span>Saturday:</span><span>${sat}</span></div>
          <div class="hours-day"><span>Sunday:</span><span>${sun}</span></div>
        </div>
        <div style="font-size: 11px; color: black; font-style: italic; margin-top: 10px; line-height: 1.4;">
          *Opening hours are correct at time of publication but are subject to change.
        </div>
      </div>
    </div>

    <div class="post-content">
${bodyParagraphs}

      <div class="callout-box tip">
        <div class="callout-header"><span>💡 <b>Pro Tip</b></span></div>
        <div class="callout-content">${proTip}</div>
      </div>

      <h3 class="glance-header" style="margin-top: 50px;">Community Reviews:</h3>
    </div>
  </article>
</div>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${placeType}",
  "name": "${title}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "${address}",
    "addressCountry": "AU"
  },
  "url": "${website || mapsUrl}",
  "hasMap": "${mapsUrl}",
  "author": {
    "@type": "Person",
    "name": "${contributorName}"
  }
}
<\/script>`
  }

  // REPLY LOGIC
  const submitDashboardReply = async () => {
    if (!replyContent.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch('/api/public-comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        content: replyContent,
        nickname: "Adam - BDWD",
        pageId: replyModal.pageId,
        pageTitle: replyModal.pageTitle,
        parentId: replyModal.parentId,
      })
    });

    if (res.ok) {
      setReplyModal({ ...replyModal, opened: false });
      setReplyContent('');
      fetchComments();
    }
  }

  const handleApprove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/public-comments?id=${id}`, { 
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ approved: true })
    })

    if (res.ok) fetchComments()
    else alert("Failed to approve comment.")
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this comment?")) {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/public-comments?id=${id}`, { 
          method: 'DELETE',
          headers: { 
              'Authorization': `Bearer ${session?.access_token}`
          }
      })

      if (res.ok) fetchComments()
      else alert("Failed to delete comment.")
    }
  }

  if (loading) return <Center h="100vh"><Stack align="center"><Title order={3}>Best Days With Dad</Title><Text>Waking up the dashboard...</Text></Stack></Center>

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <Center h="100vh" bg="#f8f9fa">
        <Paper withBorder p={40} radius="md" shadow="xl" style={{ maxWidth: 450, textAlign: 'center' }}>
          <Stack align="center" spacing="lg">
            <Box bg="blue.1" p="xl" style={{ borderRadius: '50%' }}>
              <AiOutlineLock size="3rem" color="#228be6" />
            </Box>
            <Title order={2}>Admin Access Only</Title>
            <Text color="dimmed" size="sm">
              This dashboard is restricted. {user ? `Currently logged in as ${user.email}.` : 'Please log in with the official admin account.'}
            </Text>
            <Group grow style={{ width: '100%' }}>
              <Button size="md" color="blue" onClick={handleLogin}>
                Login with Google
              </Button>
              {user && <Button size="md" variant="subtle" color="gray" onClick={handleLogout}>Log Out</Button>}
            </Group>
          </Stack>
        </Paper>
      </Center>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <Group position="apart">
          <div>
            <Title order={1}>Moderation Center</Title>
            <Text color="dimmed" size="sm">Best Days With Dad Management Portal</Text>
          </div>
          <Button variant="subtle" color="gray" onClick={handleLogout} size="xs">Log Out</Button>
        </Group>

        {/* PRIMARY WORKSPACE SELECTOR */}
        <Paper withBorder p="xs" radius="md" bg="#f1f5f9">
          <SegmentedControl
            fullWidth
            size="md"
            value={activeSection}
            onChange={setActiveSection}
            data={[
              { 
                label: `Comments (${pendingCount} Pending)`, 
                value: 'comments' 
              },
              { 
                label: `Spot Submissions (${spotSubmissions.filter(s => s.status === 'pending').length})`, 
                value: 'spots' 
              },
              { 
                label: `Contact Inquiries (${contactSubmissions.filter(s => s.status === 'pending').length})`, 
                value: 'contact' 
              }
            ]}
          />
        </Paper>

        {/* SECTION 1: COMMENTS (HIGH SCALE STREAMLINED) */}
        {activeSection === 'comments' && (
          <Paper withBorder p="lg" radius="md">
            <Stack spacing="md">
              {/* STATUS FILTER & BULK APPROVE */}
              <Group position="apart">
                <SegmentedControl
                  value={commentSubFilter}
                  onChange={(val: any) => {
                    setCommentSubFilter(val)
                    setCommentPage(1)
                  }}
                  data={[
                    { label: `Pending (${pendingCount})`, value: 'pending' },
                    { label: `Published (${comments.filter(c => c.approved).length})`, value: 'approved' },
                    { label: `Spam / Links (${flaggedCount})`, value: 'flagged' },
                    { label: `All (${comments.length})`, value: 'all' }
                  ]}
                />

                {commentSubFilter === 'pending' && pendingCount > 0 && (
                  <Button 
                    size="sm" 
                    color="green" 
                    variant="light" 
                    leftIcon={<AiOutlineCheckCircle size="1.1rem" />}
                    onClick={handleBulkApprove}
                  >
                    Approve All Pending ({pendingCount})
                  </Button>
                )}
              </Group>

              {/* SEARCH & POST FILTER CONTROLS */}
              <Group grow>
                <TextInput
                  placeholder="Search comments by keyword, nickname, email, or IP..."
                  icon={<AiOutlineSearch size="1.1rem" />}
                  value={commentSearch}
                  onChange={(e) => {
                    setCommentSearch(e.currentTarget.value)
                    setCommentPage(1)
                  }}
                />
                <Select
                  placeholder="Filter by Post..."
                  value={selectedPostFilter}
                  onChange={(val) => {
                    setSelectedPostFilter(val)
                    setCommentPage(1)
                  }}
                  data={postOptions}
                  searchable
                  clearable
                />
              </Group>

              {/* COMMENTS TABLE */}
              {filteredComments.length === 0 ? (
                <Text color="dimmed" align="center" py="xl">
                  No comments match your active filters.
                </Text>
              ) : (
                <>
                  <ScrollArea>
                    <Table verticalSpacing="md" horizontalSpacing="md" fontSize="sm" highlightOnHover>
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>User / IP</th>
                          <th style={{ width: '38%' }}>Comment</th>
                          <th style={{ width: '20%' }}>Post</th>
                          <th style={{ width: '10%' }}>Status</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedComments.map((c) => {
                          const hasLinks = c.content?.toLowerCase().includes('http')
                          return (
                            <tr key={c.id}>
                              <td>
                                <Text size="sm" weight={700}>{c.by_nickname || 'Guest'}</Text>
                                <Text size="xs" color="dimmed">{c.by_email}</Text>
                                <Group spacing={4} mt={3}>
                                  <AiOutlineGlobal size="0.75rem" color="gray" />
                                  <Text size="xs" color="blue" italic>{c.ip || '0.0.0.0'}</Text>
                                </Group>
                              </td>
                              <td>
                                <Text size="sm" style={{ lineHeight: 1.5 }}>{c.content}</Text>
                                {hasLinks && (
                                  <Group spacing={4} mt={4}>
                                    <AiOutlineWarning size="0.85rem" color="#e03131" />
                                    <Text size="xs" color="red" weight={600}>Contains external link</Text>
                                  </Group>
                                )}
                              </td>
                              <td>
                                <Text size="xs" weight={700} color="blue">{c.Page?.title || 'General'}</Text>
                                <Text size="xs" color="dimmed" truncate>{c.Page?.slug}</Text>
                              </td>
                              <td>
                                {c.approved ? (
                                  <Badge color="green">Live</Badge>
                                ) : (
                                  <Badge color="yellow">Pending</Badge>
                                )}
                              </td>
                              <td>
                                <Group spacing="xs" position="right">
                                  {!c.approved && (
                                    <Tooltip label="Approve comment" withArrow>
                                      <ActionIcon size="md" color="green" variant="filled" onClick={() => handleApprove(c.id)}>
                                        <AiOutlineCheck size="1.1rem" />
                                      </ActionIcon>
                                    </Tooltip>
                                  )}
                                  <Tooltip label="Reply as Host" withArrow>
                                    <ActionIcon 
                                      size="md" 
                                      color="blue" 
                                      variant="light" 
                                      onClick={() => setReplyModal({ 
                                        opened: true, 
                                        parentId: c.id, 
                                        pageId: c.Page?.slug, 
                                        pageTitle: c.Page?.title, 
                                        nickname: c.by_nickname 
                                      })}
                                    >
                                      <AiOutlineMessage size="1.1rem" />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Delete permanently" withArrow>
                                    <ActionIcon size="md" color="red" variant="subtle" onClick={() => handleDelete(c.id)}>
                                      <AiOutlineDelete size="1.1rem" />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </ScrollArea>

                  {/* PAGINATION BAR */}
                  <Group position="apart" pt="md">
                    <Text size="xs" color="dimmed">
                      Showing {(commentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(commentPage * ITEMS_PER_PAGE, filteredComments.length)} of {filteredComments.length} comments
                    </Text>
                    {totalPages > 1 && (
                      <Pagination
                        total={totalPages}
                        page={commentPage}
                        onChange={setCommentPage}
                        size="sm"
                      />
                    )}
                  </Group>
                </>
              )}
            </Stack>
          </Paper>
        )}

        {/* SECTION 2: SPOT SUBMISSIONS */}
        {activeSection === 'spots' && (
          <Paper withBorder p="lg" radius="md">
            <Group position="apart" mb="md">
              <div>
                <Title order={3}>Community Spot Recommendations</Title>
                <Text size="sm" color="dimmed">Review submissions and export ready-to-publish Blogger HTML.</Text>
              </div>
              <SegmentedControl
                value={subFilter}
                onChange={setSubFilter}
                data={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Reviewed', value: 'reviewed' },
                  { label: 'All', value: 'all' }
                ]}
              />
            </Group>

            {subLoading ? (
              <Center p="xl"><Loader /></Center>
            ) : spotSubmissions.length === 0 ? (
              <Text color="dimmed" align="center" py="xl">No {subFilter} spot submissions found.</Text>
            ) : (
              <ScrollArea>
                <Table verticalSpacing="sm" highlightOnHover>
                  <thead>
                    <tr>
                      <th>Spot Name</th>
                      <th>Contributor</th>
                      <th>Email</th>
                      <th>Rating</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spotSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td><Text weight={700}>{sub.title || 'Untitled'}</Text></td>
                        <td>
                          {sub.name} {sub.suburb && <Text size="xs" color="dimmed">({sub.suburb})</Text>}
                        </td>
                        <td><Text size="sm">{sub.email}</Text></td>
                        <td>
                          <Badge color="yellow">{sub.details?.rating ? `${sub.details.rating}/5.0` : 'N/A'}</Badge>
                        </td>
                        <td><Text size="xs">{new Date(sub.created_at).toLocaleDateString()}</Text></td>
                        <td>
                          <Badge color={sub.status === 'pending' ? 'yellow' : 'green'}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td>
                          <Group spacing="xs" position="right">
                            <Button 
                              size="xs" 
                              variant="light" 
                              leftIcon={<AiOutlineEye />}
                              onClick={() => setActiveSub(sub)}
                            >
                              Inspect &amp; Export
                            </Button>
                            {sub.status === 'pending' ? (
                              <ActionIcon
                                size="md"
                                color="green"
                                variant="subtle"
                                title="Mark as Reviewed"
                                onClick={() => updateSubmissionStatus(sub.id, 'reviewed')}
                              >
                                <AiOutlineCheck size="1.2rem" />
                              </ActionIcon>
                            ) : (
                              <Button
                                size="xs"
                                color="gray"
                                variant="subtle"
                                onClick={() => updateSubmissionStatus(sub.id, 'pending')}
                              >
                                Reopen
                              </Button>
                            )}
                          </Group>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            )}
          </Paper>
        )}

        {/* SECTION 3: CONTACT INQUIRIES */}
        {activeSection === 'contact' && (
          <Paper withBorder p="lg" radius="md">
            <Group position="apart" mb="md">
              <div>
                <Title order={3}>Contact Inquiries</Title>
                <Text size="sm" color="dimmed">Messages sent via the Contact Us page.</Text>
              </div>
              <SegmentedControl
                value={subFilter}
                onChange={setSubFilter}
                data={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Reviewed', value: 'reviewed' },
                  { label: 'All', value: 'all' }
                ]}
              />
            </Group>

            {subLoading ? (
              <Center p="xl"><Loader /></Center>
            ) : contactSubmissions.length === 0 ? (
              <Text color="dimmed" align="center" py="xl">No {subFilter} contact inquiries found.</Text>
            ) : (
              <ScrollArea>
                <Table verticalSpacing="sm" highlightOnHover>
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td><Text weight={700}>{sub.name}</Text></td>
                        <td><Text size="sm">{sub.email}</Text></td>
                        <td><Text weight={600}>{sub.title || 'General Inquiry'}</Text></td>
                        <td><Text size="xs">{new Date(sub.created_at).toLocaleDateString()}</Text></td>
                        <td>
                          <Badge color={sub.status === 'pending' ? 'yellow' : 'green'}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td>
                          <Group spacing="xs" position="right">
                            <Button 
                              size="xs" 
                              variant="light" 
                              leftIcon={<AiOutlineEye />}
                              onClick={() => setActiveSub(sub)}
                            >
                              Read Message
                            </Button>
                            {sub.status === 'pending' ? (
                              <ActionIcon
                                size="md"
                                color="green"
                                variant="subtle"
                                title="Mark as Done"
                                onClick={() => updateSubmissionStatus(sub.id, 'reviewed')}
                              >
                                <AiOutlineCheck size="1.2rem" />
                              </ActionIcon>
                            ) : (
                              <Button
                                size="xs"
                                color="gray"
                                variant="subtle"
                                onClick={() => updateSubmissionStatus(sub.id, 'pending')}
                              >
                                Reopen
                              </Button>
                            )}
                          </Group>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            )}
          </Paper>
        )}

        {/* SUBMISSION INSPECTION MODAL */}
        <Modal
          opened={!!activeSub}
          onClose={() => setActiveSub(null)}
          title={<Text weight={700}>{activeSub?.type === 'spot' ? 'Spot Submission Details' : 'Contact Message'}</Text>}
          size="xl"
        >
          {activeSub && (
            <Stack spacing="md">
              <Group position="apart">
                <Text weight={700} size="lg">{activeSub.title || 'Untitled'}</Text>
                <Badge color={activeSub.type === 'spot' ? 'blue' : 'teal'}>
                  {activeSub.type === 'spot' ? 'Add a Spot' : 'Contact Us'}
                </Badge>
              </Group>

              <Text size="sm">
                <b>From:</b> {activeSub.name} {activeSub.suburb && `(${activeSub.suburb})`} &bull; <b>Email:</b>{' '}
                <a href={`mailto:${activeSub.email}`} style={{ color: '#007bff' }}>
                  {activeSub.email}
                </a>
              </Text>

              {activeSub.type === 'spot' && (
                <>
                  <Group position="apart">
                    <Text weight={600} size="sm">Ready-To-Publish Blogger HTML:</Text>
                    <CopyButton value={generateBloggerHtml(activeSub)} timeout={2000}>
                      {({ copied, copy }) => (
                        <Button color={copied ? 'teal' : 'blue'} size="xs" leftIcon={<AiOutlineCopy />} onClick={copy}>
                          {copied ? 'Copied to Clipboard!' : 'Copy Blogger HTML'}
                        </Button>
                      )}
                    </CopyButton>
                  </Group>

                  <Textarea
                    value={generateBloggerHtml(activeSub)}
                    readOnly
                    minRows={10}
                    maxRows={16}
                    styles={{ input: { fontFamily: 'monospace', fontSize: '11px' } }}
                  />
                </>
              )}

              {activeSub.type === 'contact' && (
                <Paper p="md" withBorder bg="#f8fafc">
                  <Text weight={700} size="xs" color="dimmed" transform="uppercase" mb={6}>Message Content</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {activeSub.details?.message || 'No message provided.'}
                  </Text>
                </Paper>
              )}

              <Group position="right" mt="md">
                <Button variant="default" onClick={() => setActiveSub(null)}>
                  Close
                </Button>
                {activeSub.status === 'pending' ? (
                  <Button color="green" onClick={() => updateSubmissionStatus(activeSub.id, 'reviewed')}>
                    Mark as Done
                  </Button>
                ) : (
                  <Button color="gray" variant="light" onClick={() => updateSubmissionStatus(activeSub.id, 'pending')}>
                    Reopen
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </Modal>

        {/* COMMENT REPLY MODAL */}
        <Modal 
          opened={replyModal.opened} 
          onClose={() => setReplyModal({ ...replyModal, opened: false })} 
          title={`Reply to ${replyModal.nickname}`}
          centered
        >
          <Stack>
            <Text size="sm" color="dimmed">Your reply will appear instantly on the website under the "{replyModal.pageTitle}" post.</Text>
            <Textarea 
              placeholder="Write your response..." 
              minRows={4} 
              value={replyContent} 
              onChange={(e) => setReplyContent(e.currentTarget.value)} 
            />
            <Button color="blue" onClick={submitDashboardReply}>Post Reply to Website</Button>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}
