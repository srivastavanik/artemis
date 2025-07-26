const { createClient } = require('@supabase/supabase-js')
const { faker } = require('@faker-js/faker')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Helper to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to generate engagement score
const generateEngagementScore = () => ({
  total: faker.number.int({ min: 20, max: 100 }),
  email_opens: faker.number.int({ min: 0, max: 30 }),
  email_clicks: faker.number.int({ min: 0, max: 20 }),
  website_visits: faker.number.int({ min: 0, max: 50 }),
  content_downloads: faker.number.int({ min: 0, max: 10 }),
  social_interactions: faker.number.int({ min: 0, max: 20 })
})

// Helper to generate enrichment data
const generateEnrichmentData = () => ({
  company: {
    name: faker.company.name(),
    industry: faker.helpers.arrayElement(['SaaS', 'FinTech', 'HealthTech', 'E-commerce', 'EdTech', 'MarTech']),
    size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
    revenue: faker.helpers.arrayElement(['$0-$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+']),
    location: {
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country()
    },
    technologies: faker.helpers.arrayElements(
      ['React', 'Node.js', 'AWS', 'Python', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'],
      { min: 2, max: 5 }
    )
  },
  social: {
    linkedin: `https://linkedin.com/in/${faker.internet.userName()}`,
    twitter: Math.random() > 0.5 ? `https://twitter.com/${faker.internet.userName()}` : null,
    recent_posts: faker.helpers.arrayElements([
      'Just launched our new AI feature!',
      'Looking for solutions to scale our infrastructure',
      'Excited about the future of automation',
      'Building the next generation of sales tools',
      'Anyone have recommendations for CRM systems?'
    ], { min: 1, max: 3 })
  },
  intent_signals: faker.helpers.arrayElements([
    'Viewed pricing page',
    'Downloaded whitepaper',
    'Attended webinar',
    'Searched for competitors',
    'Reading implementation guides',
    'Comparing enterprise solutions'
  ], { min: 1, max: 4 }),
  pain_points: faker.helpers.arrayElements([
    'Manual data entry taking too much time',
    'Lack of visibility into sales pipeline',
    'Difficulty personalizing outreach at scale',
    'Integration challenges with existing tools',
    'Need better lead scoring',
    'Looking to improve conversion rates'
  ], { min: 1, max: 3 })
})

// Generate demo prospects
const generateProspects = async (count = 50) => {
  const prospects = []
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const company = faker.company.name()
    
    prospects.push({
      email: faker.internet.email({ firstName, lastName, provider: company.toLowerCase().replace(/[^a-z]/g, '') + '.com' }),
      first_name: firstName,
      last_name: lastName,
      title: faker.person.jobTitle(),
      company,
      linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      phone: Math.random() > 0.7 ? faker.phone.number() : null,
      status: faker.helpers.arrayElement(['new', 'qualified', 'engaged', 'opportunity', 'customer', 'lost']),
      source: faker.helpers.arrayElement(['web_scraping', 'linkedin', 'referral', 'inbound', 'event', 'cold_outreach']),
      score: faker.number.int({ min: 0, max: 100 }),
      tags: faker.helpers.arrayElements(
        ['decision_maker', 'technical_buyer', 'influencer', 'champion', 'blocker', 'economic_buyer'],
        { min: 1, max: 3 }
      ),
      notes: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      last_contacted: Math.random() > 0.5 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
      created_at: randomDate(new Date(2024, 0, 1), new Date())
    })
  }
  
  return prospects
}

// Generate demo campaigns
const generateCampaigns = async (count = 10) => {
  const campaigns = []
  
  for (let i = 0; i < count; i++) {
    const startDate = randomDate(new Date(2024, 0, 1), new Date())
    const endDate = new Date(startDate.getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000)
    
    campaigns.push({
      name: faker.helpers.arrayElement([
        'Q1 Enterprise Outreach',
        'Product Launch Campaign',
        'Re-engagement Series',
        'Black Friday Promotion',
        'Customer Success Stories',
        'Webinar Follow-up',
        'Free Trial Nurture',
        'Annual Conference Outreach'
      ]) + ` ${i + 1}`,
      type: faker.helpers.arrayElement(['email', 'multi_channel', 'linkedin', 'sequence']),
      status: faker.helpers.arrayElement(['draft', 'active', 'paused', 'completed', 'scheduled']),
      start_date: startDate,
      end_date: endDate,
      target_audience: {
        criteria: faker.helpers.arrayElements([
          'title:VP OR Director',
          'company_size:201-500',
          'industry:SaaS',
          'location:United States',
          'engagement_score:>70'
        ], { min: 2, max: 4 }),
        size: faker.number.int({ min: 50, max: 500 })
      },
      content: {
        subject_lines: faker.helpers.arrayElements([
          'Quick question about {{company}}',
          '{{first_name}}, saw your post about {{pain_point}}',
          'Ideas for {{company}}\'s growth',
          'Following up on our conversation',
          '5 ways to improve {{metric}}'
        ], { min: 2, max: 3 }),
        templates: ['template_1', 'template_2', 'template_3']
      },
      settings: {
        daily_limit: faker.number.int({ min: 50, max: 200 }),
        time_zone: 'America/New_York',
        send_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        optimal_send_times: true
      },
      metrics: {
        sent: faker.number.int({ min: 0, max: 1000 }),
        opened: faker.number.int({ min: 0, max: 800 }),
        clicked: faker.number.int({ min: 0, max: 400 }),
        replied: faker.number.int({ min: 0, max: 100 }),
        converted: faker.number.int({ min: 0, max: 50 })
      },
      created_at: randomDate(new Date(2024, 0, 1), new Date())
    })
  }
  
  return campaigns
}

// Generate agent logs
const generateAgentLogs = async (count = 100) => {
  const logs = []
  const agents = ['scout', 'analyst', 'strategist', 'executor']
  const actions = [
    'prospect_discovered',
    'data_enriched',
    'score_calculated',
    'campaign_created',
    'message_sent',
    'response_analyzed',
    'follow_up_scheduled',
    'meeting_booked'
  ]
  
  for (let i = 0; i < count; i++) {
    logs.push({
      agent_type: faker.helpers.arrayElement(agents),
      action: faker.helpers.arrayElement(actions),
      status: faker.helpers.arrayElement(['started', 'in_progress', 'completed', 'failed']),
      input_data: {
        query: faker.lorem.words(3),
        filters: faker.helpers.arrayElements(['industry:SaaS', 'location:US', 'size:51-200'], { min: 1, max: 2 })
      },
      output_data: {
        result: faker.lorem.sentence(),
        count: faker.number.int({ min: 1, max: 100 })
      },
      execution_time: faker.number.int({ min: 100, max: 5000 }),
      created_at: randomDate(new Date(2024, 0, 1), new Date())
    })
  }
  
  return logs
}

// Main seeding function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Clear existing data (optional)
    if (process.argv.includes('--clean')) {
      console.log('🧹 Cleaning existing data...')
      await supabase.from('messages').delete().gte('id', 0)
      await supabase.from('interactions').delete().gte('id', 0)
      await supabase.from('outreach_campaigns').delete().gte('id', 0)
      await supabase.from('engagement_scores').delete().gte('id', 0)
      await supabase.from('enrichment_data').delete().gte('id', 0)
      await supabase.from('prospects').delete().gte('id', 0)
      await supabase.from('agent_logs').delete().gte('id', 0)
    }
    
    // Generate and insert prospects
    console.log('👤 Creating prospects...')
    const prospects = await generateProspects(50)
    const { data: insertedProspects, error: prospectsError } = await supabase
      .from('prospects')
      .insert(prospects)
      .select()
    
    if (prospectsError) throw prospectsError
    console.log(`✅ Created ${insertedProspects.length} prospects`)
    
    // Generate and insert enrichment data
    console.log('💎 Creating enrichment data...')
    const enrichmentData = insertedProspects.slice(0, 30).map(prospect => ({
      prospect_id: prospect.id,
      ...generateEnrichmentData(),
      enriched_at: new Date()
    }))
    
    const { error: enrichmentError } = await supabase
      .from('enrichment_data')
      .insert(enrichmentData)
    
    if (enrichmentError) throw enrichmentError
    console.log(`✅ Created enrichment data for ${enrichmentData.length} prospects`)
    
    // Generate and insert engagement scores
    console.log('📊 Creating engagement scores...')
    const engagementScores = insertedProspects.slice(0, 35).map(prospect => ({
      prospect_id: prospect.id,
      score_data: generateEngagementScore(),
      calculated_at: new Date()
    }))
    
    const { error: scoresError } = await supabase
      .from('engagement_scores')
      .insert(engagementScores)
    
    if (scoresError) throw scoresError
    console.log(`✅ Created engagement scores for ${engagementScores.length} prospects`)
    
    // Generate and insert campaigns
    console.log('📢 Creating campaigns...')
    const campaigns = await generateCampaigns(10)
    const { data: insertedCampaigns, error: campaignsError } = await supabase
      .from('outreach_campaigns')
      .insert(campaigns)
      .select()
    
    if (campaignsError) throw campaignsError
    console.log(`✅ Created ${insertedCampaigns.length} campaigns`)
    
    // Generate and insert messages
    console.log('✉️ Creating messages...')
    const messages = []
    const channels = ['email', 'linkedin', 'twitter']
    
    for (const campaign of insertedCampaigns.slice(0, 5)) {
      const prospectCount = faker.number.int({ min: 5, max: 15 })
      const selectedProspects = faker.helpers.arrayElements(insertedProspects, prospectCount)
      
      for (const prospect of selectedProspects) {
        messages.push({
          campaign_id: campaign.id,
          prospect_id: prospect.id,
          channel: faker.helpers.arrayElement(channels),
          subject: faker.helpers.arrayElement([
            `Quick question about ${prospect.company}`,
            `${prospect.first_name}, saw your recent post`,
            `Ideas for ${prospect.company}'s growth`
          ]),
          content: faker.lorem.paragraphs(2),
          status: faker.helpers.arrayElement(['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced']),
          sent_at: randomDate(new Date(campaign.start_date), new Date()),
          metadata: {
            personalization_used: true,
            ab_test_variant: faker.helpers.arrayElement(['A', 'B']),
            send_time_optimized: true
          }
        })
      }
    }
    
    const { error: messagesError } = await supabase
      .from('messages')
      .insert(messages)
    
    if (messagesError) throw messagesError
    console.log(`✅ Created ${messages.length} messages`)
    
    // Generate and insert interactions
    console.log('🤝 Creating interactions...')
    const interactions = []
    const interactionTypes = ['email_open', 'email_click', 'linkedin_view', 'linkedin_accept', 'reply', 'meeting_booked']
    
    for (let i = 0; i < 100; i++) {
      const prospect = faker.helpers.arrayElement(insertedProspects)
      interactions.push({
        prospect_id: prospect.id,
        type: faker.helpers.arrayElement(interactionTypes),
        channel: faker.helpers.arrayElement(channels),
        details: {
          source: faker.helpers.arrayElement(['campaign', 'direct', 'automated']),
          duration: faker.number.int({ min: 1, max: 300 }),
          link_clicked: Math.random() > 0.5 ? faker.internet.url() : null
        },
        timestamp: randomDate(new Date(2024, 0, 1), new Date())
      })
    }
    
    const { error: interactionsError } = await supabase
      .from('interactions')
      .insert(interactions)
    
    if (interactionsError) throw interactionsError
    console.log(`✅ Created ${interactions.length} interactions`)
    
    // Generate and insert agent logs
    console.log('🤖 Creating agent logs...')
    const agentLogs = await generateAgentLogs(100)
    const { error: logsError } = await supabase
      .from('agent_logs')
      .insert(agentLogs)
    
    if (logsError) throw logsError
    console.log(`✅ Created ${agentLogs.length} agent logs`)
    
    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- Prospects: ${insertedProspects.length}`)
    console.log(`- Enrichment Data: ${enrichmentData.length}`)
    console.log(`- Engagement Scores: ${engagementScores.length}`)
    console.log(`- Campaigns: ${insertedCampaigns.length}`)
    console.log(`- Messages: ${messages.length}`)
    console.log(`- Interactions: ${interactions.length}`)
    console.log(`- Agent Logs: ${agentLogs.length}`)
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run seeding
seedDatabase()
