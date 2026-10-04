import React, { useState, useEffect } from 'react';
import {
  Table,
  Badge,
  Button,
  Group,
  Text,
  Paper,
  Title,
  Modal,
  Stack,
  SegmentedControl,
  Loader,
  Center,
  ScrollArea,
  CopyButton,
  Textarea
} from '@mantine/core';

export default function SubmissionsManager() {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions?status=${filter}`);
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (activeItem && activeItem.id === id) {
        setActiveItem(null);
      }
      fetchSubmissions();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Compiles submission data into standard Blogger HTML post template
  const generateBloggerHtml = (item) => {
    if (!item) return '';
    const details = item.details || {};
    const title = item.title || 'Spot Name';
    const contributorName = item.name || 'Anonymous';
    const suburb = item.suburb ? ` (${item.suburb})` : '';
    const address = details.address || '';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}${address}`.trim())}`;
    const website = details.website || '';
    const placeType = details.place_type || 'Place';

    const starMap = {
      '5.0': '⭐⭐⭐⭐⭐ 5.0/5.0',
      '4.5': '⭐⭐⭐⭐½ 4.5/5.0',
      '4.0': '⭐⭐⭐⭐ 4.0/5.0',
      '3.5': '⭐⭐⭐½ 3.5/5.0',
      '3.0': '⭐⭐⭐ 3.0/5.0'
    };
    const ratingDisplay = starMap[details.rating] || `${details.rating || '4.0'}/5.0`;
    const verdict = details.verdict || '';

    // Badges grid
    const badgeIcons = {
      'All Ages': '👨‍👩‍👧‍👦',
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
    };

    let badgesHtml = '';
    const badgesArray = Array.isArray(details.badges) ? details.badges : [];
    if (badgesArray.length > 0) {
      badgesArray.forEach((b) => {
        const icon = badgeIcons[b] || '✔';
        badgesHtml += `        <div class="summary-item"><span class="summary-icon">${icon}</span><span class="summary-text">${b}</span></div>\n`;
      });
    } else {
      badgesHtml = `        <div class="summary-item"><span class="summary-icon">👨‍👩‍👧‍👦</span><span class="summary-text">All Ages</span></div>\n`;
    }

    // Operating hours
    const hours = details.hours || {};
    const monThu = hours.mon_thu || '10:00 AM - 9:00 PM';
    const fri = hours.fri || '10:00 AM - 10:00 PM';
    const sat = hours.sat || '9:00 AM - 10:00 PM';
    const sun = hours.sun || '9:00 AM - 8:00 PM';

    // Body content paragraphs
    const rawBody = details.review_body || '';
    const bodyParagraphs = rawBody
      .split(/\n\s*\n/)
      .map((p) => `        <p>${p.trim()}</p>`)
      .join('\n');

    const proTip = details.pro_tip || '';

    let webMarkup = '';
    if (website) {
      const cleanWeb = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
      webMarkup = `
          <div>
            <span class="meta-label" style="color:#007bff !important; font-size:9px;">Official Website</span>
            <span class="meta-value">
              <a href="${website}" target="_blank">
                <i class="fa fa-globe" style="margin-right: 8px; color: #007bff;"></i>
                ${cleanWeb}
              </a>
            </span>
          </div>`;
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
</script>`;
  };

  return (
    <Paper p="md" shadow="xs" radius="md">
      <Group position="apart" mb="lg">
        <div>
          <Title order={3}>Community Submissions</Title>
          <Text size="sm" color="dimmed">
            Manage incoming "Add a Spot" recommendations and Contact Us inquiries.
          </Text>
        </div>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { label: 'Pending', value: 'pending' },
            { label: 'Reviewed', value: 'reviewed' },
            { label: 'All', value: 'all' }
          ]}
        />
      </Group>

      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : submissions.length === 0 ? (
        <Center p="xl">
          <Text color="dimmed">No submissions found.</Text>
        </Center>
      ) : (
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title / Spot</th>
                <th>Contributor</th>
                <th>Email</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <Badge color={sub.type === 'spot' ? 'blue' : 'teal'}>
                      {sub.type === 'spot' ? 'Add a Spot' : 'Contact'}
                    </Badge>
                  </td>
                  <td>
                    <Text weight={600}>{sub.title || 'Untitled'}</Text>
                  </td>
                  <td>
                    {sub.name} {sub.suburb && <Text size="xs" color="dimmed">({sub.suburb})</Text>}
                  </td>
                  <td>
                    <Text size="sm">{sub.email}</Text>
                  </td>
                  <td>
                    <Text size="xs">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </Text>
                  </td>
                  <td>
                    <Badge color={sub.status === 'pending' ? 'yellow' : 'green'}>
                      {sub.status}
                    </Badge>
                  </td>
                  <td>
                    <Group spacing="xs">
                      <Button size="xs" variant="light" onClick={() => setActiveItem(sub)}>
                        Inspect &amp; Export
                      </Button>
                      {sub.status === 'pending' ? (
                        <Button
                          size="xs"
                          color="green"
                          variant="subtle"
                          onClick={() => updateStatus(sub.id, 'reviewed')}
                        >
                          Mark Done
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          color="gray"
                          variant="subtle"
                          onClick={() => updateStatus(sub.id, 'pending')}
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

      {/* MODAL: INSPECT SUBMISSION & COPY BLOGGER HTML */}
      <Modal
        opened={!!activeItem}
        onClose={() => setActiveItem(null)}
        title={<Text weight={700}>Submission Inspector &amp; Post Generator</Text>}
        size="xl"
      >
        {activeItem && (
          <Stack spacing="md">
            <Group position="apart">
              <Text weight={700} size="lg">{activeItem.title || 'Untitled Spot'}</Text>
              <Badge color={activeItem.type === 'spot' ? 'blue' : 'teal'}>{activeItem.type}</Badge>
            </Group>

            <Text size="sm">
              <b>Contributor:</b> {activeItem.name} {activeItem.suburb && `(${activeItem.suburb})`} &bull; <b>Email:</b> {activeItem.email}
            </Text>

            {activeItem.type === 'spot' && (
              <>
                <Group position="apart">
                  <Text weight={600} size="sm">Ready-To-Publish Blogger HTML:</Text>
                  <CopyButton value={generateBloggerHtml(activeItem)} timeout={2000}>
                    {({ copied, copy }) => (
                      <Button color={copied ? 'teal' : 'blue'} size="xs" onClick={copy}>
                        {copied ? 'Copied to Clipboard!' : 'Copy Blogger HTML'}
                      </Button>
                    )}
                  </CopyButton>
                </Group>

                <Textarea
                  value={generateBloggerHtml(activeItem)}
                  readOnly
                  minRows={10}
                  maxRows={16}
                  styles={{ input: { fontFamily: 'monospace', fontSize: '11px' } }}
                />
              </>
            )}

            {activeItem.type === 'contact' && (
              <Paper p="sm" withBorder bg="#f8fafc">
                <Text weight={600} size="sm" mb="xs">Message Content:</Text>
                <Text size="sm">{activeItem.details?.message || 'No message provided.'}</Text>
              </Paper>
            )}

            <Group position="right" mt="md">
              <Button variant="default" onClick={() => setActiveItem(null)}>
                Close
              </Button>
              {activeItem.status === 'pending' && (
                <Button color="green" onClick={() => updateStatus(activeItem.id, 'reviewed')}>
                  Mark as Reviewed
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Paper>
  );
}
