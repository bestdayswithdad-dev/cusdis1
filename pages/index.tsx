import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useMemo } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  Textarea, Modal, Box, SegmentedControl,
  Loader, ScrollArea, CopyButton, TextInput, Select, Pagination, Tooltip,
  SimpleGrid, Image, Card, Anchor, Checkbox
} from '@mantine/core'
import { 
  AiOutlineCheck, AiOutlineDelete, AiOutlineMessage, 
  AiOutlineClockCircle, AiOutlineGlobal, AiOutlineLock, 
  AiOutlineEnvironment, AiOutlineEye, AiOutlineCopy, 
  AiOutlineSearch, AiOutlineCheckCircle, AiOutlineWarning,
  AiOutlineFlag, AiOutlineExport, AiOutlineCloseCircle,
  AiOutlineCloudUpload
} from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'
const ITEMS_PER_PAGE = 15

export const CORE_PARENT_ESSENTIALS = [
  { label: 'Fully Fenced', icon: '🚪' },
  { label: 'Toilets Onsite', icon: '🚻' },
  { label: 'Baby Change', icon: '🚼' },
  { label: 'Wheelchair Accessible', icon: '♿' },
  { label: 'Shaded Areas', icon: '🌳' },
  { label: 'Free Parking', icon: '🅿️' },
  { label: 'Coffee / Food Nearby', icon: '☕' },
  { label: 'Pram Friendly Paths', icon: '👶' },
  { label: 'BBQ Facilities', icon: '🥩' },
  { label: 'Water Fountain', icon: '🚰' },
  { label: 'Dog Friendly', icon: '🐶' }
]

export const AMENITY_ICONS: Record<string, string> = {
  'Fully Fenced': '🚪',
  'Toilets Onsite': '🚻',
  'Baby Change': '🚼',
  'Wheelchair Accessible': '♿',
  'Shaded Areas': '🌳',
  'Free Parking': '🅿️',
  'Coffee / Food Nearby': '☕',
  'Pram Friendly Paths': '👶',
  'BBQ Facilities': '🥩',
  'Water Fountain': '🚰',
  'Dog Friendly': '🐶',
  'All Ages': '👨‍👩‍👧‍👦'
}

const PROFANITY_WORDS = [
  'fuck', 'fucking', 'fucked', 'fucker',
  'shit', 'shitty', 'bullshit',
  'cunt', 'cunts',
  'bitch', 'bitches',
  'asshole', 'assholes',
  'dick', 'dicks', 'dickhead',
  'bastard', 'bastards',
  'wanker', 'wankers',
  'cock', 'piss', 'pissed'
]

function checkProfanity(text: string): boolean {
  if (!text) return false
  const pattern = new RegExp(`\\b(${PROFANITY_WORDS.join('|')})\\b`, 'i')
  return pattern.test(text)
}

interface PostFlagItem {
  id: string
  page_slug: string
  user_email: string
  flag_type: string
  notes: string
  status: string
  created_at: string
}

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
  const [modSelectedBadges, setModSelectedBadges] = useState<string[]>([])
  const [drafting, setDrafting] = useState(false)
  const [draftUrl, setDraftUrl] = useState<string | null>(null)

  // EDITABLE MODERATION FIELDS
  const [editTitle, setEditTitle] = useState('')
  const [editSuburb, setEditSuburb] = useState('')
  const [editAddress, setEditAddress] = useState('')

  // POST FLAGS STATE
  const [flags, setFlags] = useState<PostFlagItem[]>([])
  const [flagFilter, setFlagFilter] = useState('pending')
  const [flagLoading, setFlagLoading] = useState(false)
  
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

  const fetchFlags = async () => {
    setFlagLoading(true)
    try {
      let query = supabase.from('post_flags').select('*').order('created_at', { ascending: false })
      if (flagFilter !== 'all') {
        query = query.eq('status', flagFilter)
      }
      const { data, error } = await query
      if (error) throw error
      setFlags((data as PostFlagItem[]) || [])
    } catch (err) { 
      console.error("Fetch flags failed", err)
      setFlags([]) 
    } finally { 
      setFlagLoading(false) 
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchComments()
        fetchSubmissions()
        fetchFlags()
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

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchFlags()
    }
  }, [flagFilter])

  const spotSubmissions = useMemo(() => {
    return submissions.filter(s => s.type === 'spot')
  }, [submissions])

  const contactSubmissions = useMemo(() => {
    return submissions.filter(s => s.type === 'contact')
  }, [submissions])

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

  const { filteredComments, pendingCount, flaggedCount } = useMemo(() => {
    let pending = 0
    let flagged = 0

    const list = comments.filter(c => {
      const isProfane = checkProfanity(c.content)
      const hasLinks = c.content?.toLowerCase().includes('http')
      const isFlagged = isProfane || hasLinks

      if (!c.approved && !isFlagged) pending++
      if (isFlagged && !c.approved) flagged++

      if (commentSubFilter === 'pending' && (c.approved || isFlagged)) return false
      if (commentSubFilter === 'approved' && !c.approved) return false
      if (commentSubFilter === 'flagged' && (!isFlagged || c.approved)) return false

      if (selectedPostFilter && selectedPostFilter !== 'all') {
        const pageSlug = c.Page?.slug || c.Page?.title
        if (pageSlug !== selectedPostFilter) return false
      }

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

  const openSpotInspection = (sub: any) => {
    setActiveSub(sub)
    setDraftUrl(null)

    const initialTitle = sub.title || 'Untitled Spot'
    const initialSuburb = sub.suburb || sub.details?.suburb || 'Adelaide'
    const initialAddress = sub.details?.address && sub.details.address !== initialSuburb
      ? sub.details.address
      : `${initialTitle}, ${initialSuburb} SA`

    setEditTitle(initialTitle)
    setEditSuburb(initialSuburb)
    setEditAddress(initialAddress)

    const submitted = Array.isArray(sub.details?.badges) ? sub.details.badges : []
    const initialChecked = CORE_PARENT_ESSENTIALS
      .map(item => item.label)
      .filter(coreLabel => {
        const cLower = coreLabel.toLowerCase()
        return submitted.some((s: string) => {
          const sLower = s.toLowerCase()
          return sLower.includes(cLower) || cLower.includes(sLower)
        })
      })

    setModSelectedBadges(initialChecked)
  }

  const toggleCoreBadge = (label: string) => {
    setModSelectedBadges(prev => 
      prev.includes(label) ? prev.filter(b => b !== label) : [...prev, label]
    )
  }

  const handleBulkApprove = async () => {
    const cleanPending = comments.filter(c => {
      const isProfane = checkProfanity(c.content)
      const hasLinks = c.content?.toLowerCase().includes('http')
      return !c.approved && !isProfane && !hasLinks
    })

    if (!cleanPending.length) return

    if (!window.confirm(`Approve all ${cleanPending.length} clean pending comments?`)) return

    const { data: { session } } = await supabase.auth.getSession()
    await Promise.all(
      cleanPending.map(c => 
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

  const handleApprove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession()
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
    if (window.confirm("Permanently delete this comment?")) {
      const { data: { session } } = await supabase.auth.getSession()
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

  const handleCreateBloggerDraft = async () => {
    if (!activeSub) return
    setDrafting(true)
    setDraftUrl(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const htmlContent = generateBloggerHtml(activeSub, modSelectedBadges, editTitle, editSuburb, editAddress)
      
      const labels = [
        editSuburb,
        ...modSelectedBadges
      ].filter(Boolean)

      const res = await fetch('/api/blogger/create-draft', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title: editTitle || 'Spot Recommendation',
          content: htmlContent,
          labels,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create draft in Blogger')

      setDraftUrl(data.draftUrl)
      await updateSubmissionStatus(activeSub.id, 'reviewed')
    } catch (err: any) {
      console.error('Blogger draft error:', err)
      alert(`Could not create draft: ${err.message}`)
    } finally {
      setDrafting(false)
    }
  }

  const updateFlagStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('post_flags')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      fetchFlags()
    } catch (err) {
      console.error("Failed to update flag status", err)
      alert("Failed to update flag status.")
    }
  }

  const deleteFlag = async (id: string) => {
    if (!window.confirm("Permanently delete this report?")) return
    try {
      const { error } = await supabase
        .from('post_flags')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchFlags()
    } catch (err) {
      console.error("Failed to delete flag", err)
      alert("Failed to delete flag.")
    }
  }

  const getFlagBadgeColor = (type: string) => {
    switch (type) {
      case 'permanently_closed': return 'red'
      case 'equipment': return 'orange'
      case 'hours': return 'blue'
      case 'pricing': return 'yellow'
      default: return 'gray'
    }
  }

  // MASTER v5.6 POST GENERATOR (STANDARDIZED MATURE TIERS + BRAND SLOGAN)
  const generateBloggerHtml = (
    item: any, 
    selectedCoreBadges: string[],
    spotTitle: string,
    spotSuburb: string,
    spotAddress: string
  ) => {
    if (!item) return ''
    const details = item.details || {}
    const title = spotTitle || item.title || 'Spot Name'
    
    const contributorName = (
      item.name || 
      details.author_name || 
      details.name || 
      details.contributor_name || 
      details.user_name || 
      (item.email ? item.email.split('@')[0] : '') || 
      'Community Scout'
    ).trim()

    const contributorEmail = item.email || ''
    
    const finalAddress = spotAddress.trim() || `${title}, ${spotSuburb || 'Adelaide'} SA`
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalAddress)}`
    
    const website = details.website || ''
    const placeType = details.place_type || 'Park'

    const starMap: Record<string, string> = {
      '5.0': '⭐⭐⭐⭐⭐ 5.0 / 5.0',
      '4.5': '⭐⭐⭐⭐½ 4.5 / 5.0',
      '4.0': '⭐⭐⭐⭐ 4.0 / 5.0',
      '3.5': '⭐⭐⭐½ 3.5 / 5.0',
      '3.0': '⭐⭐⭐ 3.0 / 5.0',
      '2.5': '⭐⭐½ 2.5 / 5.0',
      '2.0': '⭐⭐ 2.0 / 5.0'
    }
    const ratingDisplay = starMap[details.rating] || `⭐⭐⭐⭐ ${details.rating || '4.0'} / 5.0`
    const verdict = details.verdict || 'A great Adelaide spot for the whole family to explore.'

    const photos: string[] = Array.isArray(details.image_urls) && details.image_urls.length > 0
      ? details.image_urls
      : details.image_url ? [details.image_url] : []

    const isMultiPhoto = photos.length > 1
    let mediaBlock = ''

    if (isMultiPhoto) {
      const slidesHtml = photos
        .map((url, idx) => `            <div class="carousel-slide"><img src="${url}" alt="${title} Photo ${idx + 1}" onclick="openLightbox(${idx})"></div>`)
        .join('\n')

      const indicatorsHtml = photos
        .map((_, idx) => `            <div class="carousel-indicator ${idx === 0 ? 'active' : ''}"></div>`)
        .join('\n')

      mediaBlock = `      <div class="image-container">
        <div class="carousel-container">
          <div class="carousel">
${slidesHtml}
          </div>
          <button class="carousel-btn carousel-btn-prev" aria-label="Previous image">❮</button>
          <button class="carousel-btn carousel-btn-next" aria-label="Next image">❯</button>
          <div class="carousel-indicators">
${indicatorsHtml}
          </div>
        </div>
      </div>`
    } else {
      const singleImg = photos[0] || 'https://via.placeholder.com/1200x600/0f172a/ffffff?text=Add+Photo'
      mediaBlock = `      <div class="single-image-container">
        <div class="single-image-wrapper">
          <img src="${singleImg}" alt="${title}">
        </div>
      </div>`
    }

    const finalBadges = selectedCoreBadges.length > 0 ? selectedCoreBadges : ['Free Parking', 'Shaded Areas']
    let badgesHtml = ''
    finalBadges.forEach((b: string) => {
      const icon = AMENITY_ICONS[b] || '✔'
      badgesHtml += `          <div class="summary-item"><span class="summary-icon">${icon}</span><span class="summary-text">${b}</span></div>\n`
    })

    const hours = details.hours || {}
    const hasHours = hours.mon_fri || hours.mon_thu || hours.sat_sun || hours.sat
    let hoursBlock = ''

    if (hasHours) {
      const monFri = hours.mon_fri || hours.mon_thu || '9:00 AM - 5:00 PM'
      const satSun = hours.sat_sun || hours.sat || '9:00 AM - 6:00 PM'
      hoursBlock = `
        <div class="meta-item-right">
          <span class="hours-title">Standard Operating Hours</span>
          <div class="hours-grid">
            <div class="hours-day"><span>Mon - Fri:</span><span>${monFri}</span></div>
            <div class="hours-day"><span>Sat - Sun:</span><span>${satSun}</span></div>
          </div>
          <div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 10px; line-height: 1.4;">
            *Hours extend during South Australian school holidays.
          </div>
        </div>`
    }

    const rawBody = details.review_body || ''
    const bodyParagraphs = rawBody
      ? rawBody.split(/\n\s*\n/).map((p: string) => `        <p>${p.trim()}</p>`).join('\n')
      : `        <p>${title} is a fantastic family-friendly destination offering great amenities and space for children to play and explore.</p>`

    const proTip = details.pro_tip || 'Aim to arrive early on weekends to secure shaded seating and easy parking.'

    return `<style>
/* MASTER v5.6: MOBILE-OPTIMISED OUTING STANDARD */
.post-title-container, .post-header-line-1, .post-header { display: none !important; }
.container { max-width: 1000px; margin: 0 auto; padding: 0; width: 100%; }

.post-subtitle { 
  display: block; text-align: center; font-size: 15px; font-weight: 800; 
  text-transform: uppercase; letter-spacing: 4px; color: #2e5984; margin-top: 40px; 
}
.post-title { 
  font-size: 2.5rem !important; font-weight: 900 !important; color: #1e293b !important; 
  text-align: center; margin: 10px 15px !important; letter-spacing: -1.5px !important; 
  text-transform: uppercase !important; line-height: 1.1; 
}
.title-accent { 
  width: 60px !important; height: 4px !important; background: #c7af76 !important; 
  margin: 15px auto 20px auto !important; border-radius: 2px !important; 
}

/* COMMUNITY CONTRIBUTOR BANNER */
.contributor-box-wrapper {
  display: flex !important;
  justify-content: center !important;
  width: 100% !important;
  margin: 0 0 25px 0 !important;
  padding: 0 10px !important;
  box-sizing: border-box !important;
}

.contributor-attribution {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 30px !important;
  padding: 8px 18px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #475569 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03) !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.contributor-attribution i {
  color: #2e5984 !important;
  font-size: 14px !important;
}

.contributor-highlight { 
  color: #0f172a !important; 
  font-weight: 800 !important; 
}

/* MATURE TYPOGRAPHIC TIER BADGES */
.bdwd-tier-badge {
  font-size: 10px !important;
  font-weight: 900 !important;
  text-transform: uppercase !important;
  padding: 3px 9px !important;
  border-radius: 6px !important;
  display: inline-flex !important;
  align-items: center !important;
  letter-spacing: 0.8px !important;
  border: 1px solid transparent !important;
  margin-left: 8px !important;
  vertical-align: middle !important;
  line-height: 1.2 !important;
}

.tier-host { background: #fef3c7 !important; color: #92400e !important; border-color: #fcd34d !important; }
.tier-legend { background: #fee2e2 !important; color: #991b1b !important; border-color: #fca5a5 !important; }
.tier-top { background: #ede9fe !important; color: #5b21b6 !important; border-color: #c4b5fd !important; }
.tier-spot { background: #dcfce7 !important; color: #166534 !important; border-color: #86efac !important; }
.tier-verified { background: #e0f2fe !important; color: #075985 !important; border-color: #7dd3fc !important; }
.tier-guest { background: #f1f5f9 !important; color: #475569 !important; border-color: #cbd5e1 !important; }

.single-image-container { 
  position: relative; display: block; width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.15); 
  border-radius: 20px; margin-bottom: 30px; overflow: hidden; background: #0f172a; line-height: 0; 
}
.single-image-wrapper { position: relative; width: 100%; overflow: hidden; line-height: 0; }
.single-image-wrapper img { width: 100%; height: auto; max-height: 480px; object-fit: cover; display: block; }

.image-container { 
  position: relative; display: block; width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.15); 
  border-radius: 20px; margin-bottom: 30px; overflow: hidden; background-color: #0f172a; 
}
.carousel-container { 
  position: relative; width: 100%; overflow: hidden; border-radius: 20px; height: 500px; 
  display: flex; align-items: center; 
}
.carousel { display: flex; transition: transform 0.45s ease-in-out; width: 100%; height: 100%; }
.carousel-slide { 
  min-width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #0f172a; 
}
.carousel-slide img { width: 100%; height: 100%; object-fit: cover; display: block; cursor: zoom-in; }
.carousel-btn { 
  position: absolute; top: 0; bottom: 0; background: rgba(15, 23, 42, 0.25); color: white; 
  border: none; width: 50px; cursor: pointer; z-index: 2; font-size: 20px; display: flex; 
  align-items: center; justify-content: center; transition: background 0.2s ease; 
}
.carousel-btn:hover { background: rgba(15, 23, 42, 0.65); }
.carousel-btn-prev { left: 0; }
.carousel-btn-next { right: 0; }
.carousel-indicators { 
  position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 5; 
}
.carousel-indicator { 
  width: 9px; height: 9px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.5); 
  cursor: pointer; transition: all 0.2s ease; 
}
.carousel-indicator.active { background-color: #2e5984; transform: scale(1.3); }

/* AT A GLANCE */
.glance-header { 
  text-align: center !important; font-size: 15px !important; text-transform: uppercase !important; 
  letter-spacing: 3px !important; color: #64748b !important; margin: 45px 0 25px 0 !important; 
  display: flex !important; justify-content: center !important; gap: 10px !important; font-weight: 800 !important; 
}
.summary-grid { 
  display: grid !important; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important; 
  gap: 12px !important; margin: 0 15px 35px 15px !important; 
}
.summary-item { 
  background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 12px !important; 
  padding: 16px 8px !important; text-align: center; transition: all 0.3s ease; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: center; 
}
.summary-item:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.06); border-color: #2e5984 !important; }
.summary-icon { font-size: 1.8rem !important; margin-bottom: 8px; display: block; }
.summary-text { font-size: 11px !important; font-weight: 800 !important; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; line-height: 1.3; }

/* GOLD VERDICT BOX */
.best-day-verdict { 
  background: linear-gradient(135deg, #fffdf5 0%, #ffffff 100%) !important; border-radius: 12px !important; 
  border: 1px solid #fef3c7 !important; border-left: 6px solid #c7af76 !important; padding: 20px 22px !important; 
  margin: 20px 15px 35px 15px !important; box-shadow: 0 4px 15px rgba(199, 175, 118, 0.08); 
}
.verdict-header { color: #b45309 !important; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; font-size: 12px; display: block; }
.verdict-summary { 
  color: #1e293b !important; font-size: 1.15rem !important; font-weight: 700; line-height: 1.35; 
  margin: 8px 0 0 0 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; 
  overflow: hidden; text-overflow: ellipsis; 
}

/* DATA SECTION */
.meta-box { 
  border-top: 1px solid #e2e8f0; padding: 35px 20px !important; display: flex; justify-content: space-between; 
  flex-wrap: wrap; gap: 30px; background: #f8fafc; border-radius: 16px; margin: 0 15px 40px 15px; border: 1px solid #e2e8f0; 
}
.meta-label, .hours-title { color: #64748b !important; font-weight: 800; font-size: 12px !important; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; display: block; }
.meta-value a { 
  font-size: 15px; color: #1e293b !important; font-weight: 700; text-decoration: none; 
  border-bottom: 2px solid rgba(46, 89, 132, 0.2); transition: all 0.2s ease; display: inline-block; 
}
.meta-value a:hover { color: #2e5984 !important; border-bottom-color: #2e5984; }

.hours-grid { display: grid; gap: 8px; margin-top: 5px; width: 100%; }
.hours-day { display: flex; justify-content: space-between; padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #334155; }

/* CALLOUTS */
.callout-box { 
  background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-left: 5px solid #2e5984 !important; 
  padding: 22px 24px !important; border-radius: 12px !important; margin: 30px 15px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
}
.callout-box.tip { border-left-color: #10b981 !important; }
.callout-header { 
  display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13px !important; 
  text-transform: uppercase; letter-spacing: 1px; color: #2e5984; margin-bottom: 8px; 
}
.callout-box.tip .callout-header { color: #059669; }
.callout-content { font-size: 16px; line-height: 1.6; color: #334155; }

.post-content p { font-size: 17px !important; line-height: 1.8; color: #334155 !important; margin: 0 15px 24px 15px; font-weight: 400; }

/* LIGHTBOX */
.lightbox { 
  display: none; position: fixed; z-index: 999999; top: 0; left: 0; width: 100%; height: 100%; 
  background-color: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); justify-content: center; 
  align-items: center; padding: 20px; box-sizing: border-box; 
}
.lightbox-content { max-width: 92%; max-height: 88vh; object-fit: contain; border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
.lightbox-close { 
  position: absolute; top: 20px; right: 25px; color: #e2e8f0; font-size: 40px; font-weight: 300; 
  cursor: pointer; line-height: 1; transition: color 0.2s; 
}
.lightbox-close:hover { color: #ffffff; }

#custom-comment-section { 
  width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; 
  display: block !important; margin-top: 15px !important; margin-bottom: 40px !important; clear: both !important; 
}
.comment-disclaimer { margin-top: -35px !important; }

@media (max-width: 768px) {
  .container { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
  .single-image-container { border-radius: 0 !important; margin-bottom: 25px; box-shadow: none; background: transparent; }
  .single-image-wrapper img { height: 250px !important; object-fit: cover !important; border-radius: 0 !important; }
  .image-container, .carousel-container { height: 260px !important; border-radius: 0 !important; margin-bottom: 25px; box-shadow: none; }
  .post-title { font-size: 1.5rem !important; margin: 10px !important; }
  .post-subtitle { font-size: 12px !important; letter-spacing: 2px; }
  .contributor-attribution { font-size: 11px !important; padding: 6px 12px !important; }

  .summary-grid { 
    grid-template-columns: repeat(2, 1fr) !important; margin: 0 12px 30px 12px !important; gap: 10px !important; 
  }
  .best-day-verdict { margin: 10px 12px 30px 12px !important; padding: 18px 16px !important; border-radius: 8px !important; }
  .verdict-summary { font-size: 1.05rem !important; line-height: 1.35 !important; }
  .meta-box { flex-direction: column; gap: 20px; padding: 24px 16px !important; margin: 0 12px 30px 12px !important; }
  .callout-box { margin: 25px 0 !important; border-radius: 0 !important; border-left-width: 6px !important; border-right: none !important; padding: 20px 18px !important; box-shadow: none !important; }
  .post-content p { margin: 0 14px 22px 14px; font-size: 16px !important; }
}
</style>

<div class="container">
  <article class="post">
    <header class="hero-header">
      <span class="post-subtitle">Best Days With Dad - No Nonsense Review</span>
      <h1 class="post-title">${title}</h1>
      <div class="title-accent"></div>
    </header>

    <!-- COMMUNITY CONTRIBUTOR ATTRIBUTION -->
    <div class="contributor-box-wrapper">
      <div class="contributor-attribution">
        <i class="fa fa-user-check"></i>
        <span>Contributed by <span class="contributor-highlight">${contributorName}</span></span>
        <span class="bdwd-tier-badge tier-spot" data-contributor-tier-target="${contributorEmail}">
          Spot Contributor
        </span>
      </div>
    </div>

${mediaBlock}

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
      <div class="meta-item">
        <span class="meta-label">Location Visited</span>
        <span class="meta-value">
          <a href="${mapsUrl}" target="_blank" rel="noopener">
            📍 ${finalAddress}
          </a>
        </span>
      </div>
      ${website ? `
      <div class="meta-item">
        <span class="meta-label">Direct Bookings</span>
        <span class="meta-value">
          <a href="${website}" target="_blank" rel="noopener">
            🌐 ${website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        </span>
      </div>` : ''}
${hoursBlock}
    </div>

    <div class="post-content">
${bodyParagraphs}

      <div class="callout-box tip">
        <div class="callout-header">
          <span>🎯</span>
          <span><b>Pro Tip for Parents</b></span>
        </div>
        <div class="callout-content">
          ${proTip}
        </div>
      </div>
    </div>

    <h3 class="glance-header" style="margin-top: 50px;">💬 Community Reviews</h3>
    <p style="text-align:center; color:#64748b; font-size:15px; margin-bottom: 25px;">Been down to ${title}? Share your thoughts below.</p>

    <div id="custom-comment-section"></div>
  </article>
</div>

${isMultiPhoto ? `
<div id="bdwd-lightbox" class="lightbox" onclick="closeLightbox()">
  <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
  <img class="lightbox-content" id="lightbox-img" alt="Enlarged Park View" onclick="event.stopPropagation()">
</div>

<script>
  let currentLbIndex = 0;
  let lbImages = [];

  function openLightbox(index) {
    const images = document.querySelectorAll('.carousel-slide img');
    lbImages = Array.from(images).map(img => img.src);
    currentLbIndex = index;
    const lightbox = document.getElementById('bdwd-lightbox');
    if (lightbox) {
      document.getElementById('lightbox-img').src = lbImages[currentLbIndex];
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    const lightbox = document.getElementById('bdwd-lightbox');
    if (lightbox) {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('bdwd-lightbox');
    if (lightbox && lightbox.style.display === 'flex') {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') {
        currentLbIndex = (currentLbIndex + 1) % lbImages.length;
        document.getElementById('lightbox-img').src = lbImages[currentLbIndex];
      }
      if (e.key === 'ArrowLeft') {
        currentLbIndex = (currentLbIndex - 1 + lbImages.length) % lbImages.length;
        document.getElementById('lightbox-img').src = lbImages[currentLbIndex];
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel');
    const indicators = document.querySelectorAll('.carousel-indicator');
    if (!carousel || indicators.length === 0) return;

    let currentIndex = 0;
    const total = indicators.length;

    function update() {
      carousel.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));
    }

    const nextBtn = document.querySelector('.carousel-btn-next');
    const prevBtn = document.querySelector('.carousel-btn-prev');

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % total;
        update();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + total) % total;
        update();
      });
    }

    indicators.forEach((ind, i) => {
      ind.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = i;
        update();
      });
    });
  });
</script>` : ''}

<script 
  src="https://cusdis-jet-one.vercel.app/js/comment-loader.js" 
  data-app-id="cbcd61ec-f2ef-425c-a952-30034c2de4e1" 
  data-host="https://cusdis-jet-one.vercel.app" 
  async 
  defer>
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${placeType}",
  "name": "${title}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "${finalAddress}",
    "addressCountry": "AU"
  },
  "url": "https://www.bestdayswithdad.com.au",
  "hasMap": "${mapsUrl}"
}
</script>`
  }

  const submitDashboardReply = async () => {
    if (!replyContent.trim()) return
    const { data: { session } } = await supabase.auth.getSession()
    
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
    })

    if (res.ok) {
      setReplyModal({ ...replyModal, opened: false })
      setReplyContent('')
      fetchComments()
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
              },
              { 
                label: `Flagged Updates (${flags.filter(f => f.status === 'pending').length})`, 
                value: 'flags' 
              }
            ]}
          />
        </Paper>

        {/* SECTION 1: COMMENTS */}
        {activeSection === 'comments' && (
          <Paper withBorder p="lg" radius="md">
            <Stack spacing="md">
              <Group position="apart">
                <SegmentedControl
                  value={commentSubFilter}
                  onChange={(val: any) => {
                    setCommentSubFilter(val)
                    setCommentPage(1)
                  }}
                  data={[
                    { label: `Pending Clean (${pendingCount})`, value: 'pending' },
                    { label: `Flagged / Profanity (${flaggedCount})`, value: 'flagged' },
                    { label: `Published (${comments.filter(c => c.approved).length})`, value: 'approved' },
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
                    Approve All Clean Pending ({pendingCount})
                  </Button>
                )}
              </Group>

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
                          const isProfane = checkProfanity(c.content)
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
                                {isProfane && (
                                  <Badge color="red" size="xs" variant="filled" mt={4}>
                                    Profanity Detected
                                  </Badge>
                                )}
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
                                ) : isProfane || hasLinks ? (
                                  <Badge color="red">Flagged</Badge>
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

                  <Group position="apart" pt="md">
                    <Text size="xs" color="dimmed">
                      Showing {(commentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(commentPage * ITEMS_PER_PAGE, filteredComments.length)} of {filteredComments.length} comments
                    </Text>
                    {totalPages > 1 && (
                      <Pagination
                        total={totalPages}
                        value={commentPage}
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
                <Text size="sm" color="dimmed">Review submissions, customize precise location metadata, and create drafts.</Text>
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
                      <th>Suburb</th>
                      <th>Contributor</th>
                      <th>Rating</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spotSubmissions.map((sub) => {
                      const contributor = 
                        sub.name || 
                        sub.details?.author_name || 
                        sub.details?.name || 
                        sub.details?.contributor_name || 
                        'Anonymous'

                      const suburb = sub.suburb || sub.details?.suburb || 'Adelaide'

                      return (
                        <tr key={sub.id}>
                          <td><Text weight={700}>{sub.title || 'Untitled'}</Text></td>
                          <td><Badge color="blue" variant="light">{suburb}</Badge></td>
                          <td>
                            <Text size="sm" weight={600}>{contributor}</Text>
                            <Text size="xs" color="dimmed">{sub.email}</Text>
                          </td>
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
                                onClick={() => openSpotInspection(sub)}
                              >
                                Inspect &amp; Publish
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
                      )
                    })}
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

        {/* SECTION 4: FLAGGED SPOT UPDATES */}
        {activeSection === 'flags' && (
          <Paper withBorder p="lg" radius="md">
            <Group position="apart" mb="md">
              <div>
                <Title order={3}>Community Spot Update Flags</Title>
                <Text size="sm" color="dimmed">
                  User-reported updates, repairs, price changes, and gate hour alerts.
                </Text>
              </div>
              <SegmentedControl
                value={flagFilter}
                onChange={setFlagFilter}
                data={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Resolved', value: 'resolved' },
                  { label: 'Dismissed', value: 'dismissed' },
                  { label: 'All', value: 'all' }
                ]}
              />
            </Group>

            {flagLoading ? (
              <Center p="xl"><Loader /></Center>
            ) : flags.length === 0 ? (
              <Text color="dimmed" align="center" py="xl">
                No {flagFilter} update flags found.
              </Text>
            ) : (
              <ScrollArea>
                <Table verticalSpacing="sm" highlightOnHover>
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Spot / Slug</th>
                      <th style={{ width: '15%' }}>Category</th>
                      <th style={{ width: '35%' }}>Reported Details</th>
                      <th style={{ width: '13%' }}>Reporter</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flags.map((flag) => (
                      <tr key={flag.id}>
                        <td>
                          <Group spacing={6}>
                            <Text weight={700} size="sm">{flag.page_slug}</Text>
                            <Anchor
                              href={`https://www.bestdayswithdad.com.au/${flag.page_slug}.html`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ActionIcon size="xs" variant="transparent" color="blue">
                                <AiOutlineExport size="1rem" />
                              </ActionIcon>
                            </Anchor>
                          </Group>
                          <Text size="xs" color="dimmed">{new Date(flag.created_at).toLocaleDateString()}</Text>
                        </td>
                        <td>
                          <Badge color={getFlagBadgeColor(flag.flag_type)} variant="light">
                            {flag.flag_type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td>
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {flag.notes}
                          </Text>
                        </td>
                        <td>
                          <Text size="xs" color="dimmed">{flag.user_email || 'Anonymous'}</Text>
                        </td>
                        <td>
                          <Group spacing="xs" position="right">
                            {flag.status === 'pending' && (
                              <>
                                <Tooltip label="Mark Resolved" withArrow>
                                  <ActionIcon
                                    size="md"
                                    color="green"
                                    variant="light"
                                    onClick={() => updateFlagStatus(flag.id, 'resolved')}
                                  >
                                    <AiOutlineCheck size="1.1rem" />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Dismiss Note" withArrow>
                                  <ActionIcon
                                    size="md"
                                    color="gray"
                                    variant="subtle"
                                    onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                                  >
                                    <AiOutlineCloseCircle size="1.1rem" />
                                  </ActionIcon>
                                </Tooltip>
                              </>
                            )}
                            {flag.status !== 'pending' && (
                              <Button
                                size="xs"
                                color="gray"
                                variant="subtle"
                                onClick={() => updateFlagStatus(flag.id, 'pending')}
                              >
                                Reopen
                              </Button>
                            )}
                            <Tooltip label="Delete Permanently" withArrow>
                              <ActionIcon
                                size="md"
                                color="red"
                                variant="subtle"
                                onClick={() => deleteFlag(flag.id)}
                              >
                                <AiOutlineDelete size="1.1rem" />
                              </ActionIcon>
                            </Tooltip>
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

        {/* SUBMISSION INSPECTION & MODERATION MODAL */}
        <Modal
          opened={!!activeSub}
          onClose={() => {
            setActiveSub(null)
            setDraftUrl(null)
          }}
          title={<Text weight={700}>{activeSub?.type === 'spot' ? 'Review & Format Spot for Blogger' : 'Contact Message'}</Text>}
          size="xl"
        >
          {activeSub && (() => {
            const author = 
              activeSub.name || 
              activeSub.details?.author_name || 
              activeSub.details?.name || 
              activeSub.details?.contributor_name || 
              'Community Scout'

            return (
              <Stack spacing="md">
                <Paper withBorder p="sm" radius="md" bg="#f8fafc">
                  <Group position="apart">
                    <Group spacing="xs">
                      <Text size="sm"><b>Contributor:</b> {author}</Text>
                      {activeSub.email && !activeSub.email.includes('anonymous@') && (
                        <Badge size="xs" color="blue" variant="filled">Registered User</Badge>
                      )}
                    </Group>
                    <Text size="xs" color="dimmed">{activeSub.email}</Text>
                  </Group>
                </Paper>

                {activeSub.type === 'spot' && (
                  <Paper withBorder p="md" radius="md">
                    <Text size="xs" weight={800} color="#2e5984" transform="uppercase" mb="xs">
                      1. Confirm Location &amp; Maps Search Target
                    </Text>
                    <SimpleGrid cols={2} spacing="sm">
                      <TextInput
                        label="Spot Title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.currentTarget.value)}
                        placeholder="e.g. Marshmallow Park"
                        required
                      />
                      <TextInput
                        label="Suburb / Council"
                        value={editSuburb}
                        onChange={(e) => setEditSuburb(e.currentTarget.value)}
                        placeholder="e.g. Adelaide Park Lands"
                        required
                      />
                    </SimpleGrid>
                    <TextInput
                      mt="xs"
                      label="Exact Address / Google Maps Search Query"
                      description="Parents clicking 'Location Visited' will open Google Maps directly to this exact spot."
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.currentTarget.value)}
                      placeholder="e.g. Marshmallow Park, Glen Osmond Rd, Adelaide SA 5000"
                      rightSection={
                        <Anchor 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editAddress)}`} 
                          target="_blank" 
                          rel="noopener"
                        >
                          <ActionIcon size="sm" color="blue" title="Test Google Maps Link">
                            <AiOutlineEnvironment size="1rem" />
                          </ActionIcon>
                        </Anchor>
                      }
                    />
                  </Paper>
                )}

                {activeSub.type === 'spot' && (
                  <Box>
                    <Text size="xs" weight={700} color="dimmed" transform="uppercase" mb={6}>
                      Submitted Photos ({Array.isArray(activeSub.details?.image_urls) ? activeSub.details.image_urls.length : (activeSub.details?.image_url ? 1 : 0)} / 6)
                    </Text>
                    {(Array.isArray(activeSub.details?.image_urls) && activeSub.details.image_urls.length > 0) || activeSub.details?.image_url ? (
                      <SimpleGrid cols={6} spacing="xs">
                        {(activeSub.details?.image_urls || [activeSub.details.image_url]).map((imgUrl: string, idx: number) => (
                          <Card key={idx} p={2} withBorder radius="sm">
                            <Image src={imgUrl} height={70} fit="cover" alt={`Photo ${idx + 1}`} />
                          </Card>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text size="xs" color="dimmed" fs="italic">No photos attached by contributor.</Text>
                    )}
                  </Box>
                )}

                {activeSub.type === 'spot' && (
                  <Paper withBorder p="md" radius="md" bg="#f8fafc">
                    <Stack spacing="xs">
                      <div>
                        <Text size="xs" weight={800} color="#2e5984" transform="uppercase">
                          2. Core Parent Essentials Checklist
                        </Text>
                        <Text size="xs" color="dimmed" mb={10}>
                          Select logistical features to render in the post:
                        </Text>
                        <SimpleGrid cols={2} spacing="xs">
                          {CORE_PARENT_ESSENTIALS.map((item) => {
                            const isChecked = modSelectedBadges.includes(item.label)
                            return (
                              <Checkbox
                                key={item.label}
                                label={`${item.icon} ${item.label}`}
                                checked={isChecked}
                                onChange={() => toggleCoreBadge(item.label)}
                                size="sm"
                              />
                            )
                          })}
                        </SimpleGrid>
                      </div>
                    </Stack>
                  </Paper>
                )}

                {activeSub.type === 'spot' && (
                  <Paper p="md" withBorder bg="#f0f7ff" radius="md">
                    <Group position="apart">
                      <div>
                        <Text size="sm" weight={700} color="#0056b3">Blogger Direct Publishing</Text>
                        <Text size="xs" color="dimmed">Generates the draft with the precise address and verified badge.</Text>
                      </div>

                      <Group>
                        <Button
                          color="blue"
                          loading={drafting}
                          leftIcon={<AiOutlineCloudUpload size="1.2rem" />}
                          onClick={handleCreateBloggerDraft}
                        >
                          Create Blogger Draft
                        </Button>

                        {draftUrl && (
                          <Anchor href={draftUrl} target="_blank" rel="noopener noreferrer">
                            <Button color="green" variant="light" leftIcon={<AiOutlineExport size="1rem" />}>
                              Open Draft in Blogger
                            </Button>
                          </Anchor>
                        )}
                      </Group>
                    </Group>
                  </Paper>
                )}

                {activeSub.type === 'spot' && (
                  <>
                    <Group position="apart">
                      <Text weight={600} size="sm">Review HTML (Master v5.6 Standard):</Text>
                      <CopyButton value={generateBloggerHtml(activeSub, modSelectedBadges, editTitle, editSuburb, editAddress)} timeout={2000}>
                        {({ copied, copy }) => (
                          <Button color={copied ? 'teal' : 'blue'} size="xs" leftIcon={<AiOutlineCopy />} onClick={copy}>
                            {copied ? 'Copied to Clipboard!' : 'Copy Blogger HTML'}
                          </Button>
                        )}
                      </CopyButton>
                    </Group>

                    <Textarea
                      value={generateBloggerHtml(activeSub, modSelectedBadges, editTitle, editSuburb, editAddress)}
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
                  <Button variant="default" onClick={() => {
                    setActiveSub(null)
                    setDraftUrl(null)
                  }}>
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
            )
          })()}
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
