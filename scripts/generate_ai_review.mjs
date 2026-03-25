import PocketBase from 'pocketbase';

// Configuration
const PB_URL = 'https://db.sipoma.online';
const PB_EMAIL = 'ardila.firdaus@sig.id';
const PB_PASSWORD = 'makassar@270989';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function generateReview() {
  try {
    console.log('--- AI Operational Review Generator ---');
    
    // 1. Authenticate
    console.log('Authenticating...');
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

    // 2. Get Dates (Yesterday) using local timezone
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log(`Target Date: ${dateStr}`);

    // 3. Get x.AI API Key (Using broader filter for robustness)
    console.log('Fetching x.AI API Key...');
    const xaiRecord = await pb.collection('api_key').getFirstListItem('provider ~ "xai"');
    const apiKey = xaiRecord.key;

    // 4. Get Plant Units
    console.log('Fetching Plant Units...');
    const units = await pb.collection('plant_units').getFullList();
    const rkcUnits = await pb.collection('rkc_plant_units').getFullList().catch(() => []);
    const allUnits = [...units, ...rkcUnits];

    // 5. Fetch Data from 7 Collections
    console.log('Fetching operational data...');
    const filter = `date="${dateStr}"`;
    
    const [
      downtime,
      info,
      material,
      params,
      silo,
      moisture,
      capacity,
      paramSettings
    ] = await Promise.all([
      pb.collection('ccr_downtime_data').getFullList({ filter }).catch(() => []),
      pb.collection('ccr_information').getFullList({ filter }).catch(() => []),
      pb.collection('ccr_material_usage').getFullList({ filter }).catch(() => []),
      pb.collection('ccr_parameter_data').getFullList({ filter }).catch(() => []),
      pb.collection('ccr_silo_data').getFullList({ filter }).catch(() => []),
      pb.collection('moisture_monitoring').getFullList({ filter }).catch(() => []),
      pb.collection('monitoring_production_capacity').getFullList({ filter }).catch(() => []),
      pb.collection('parameter_settings').getFullList().catch(() => [])
    ]);

    // Handle RKC counterparts if they exist
    const [rkcDowntime, rkcInfo, rkcMaterial, rkcParams, rkcSilo] = await Promise.all([
      pb.collection('rkc_ccr_downtime_data').getFullList({ filter }).catch(() => []),
      pb.collection('rkc_ccr_information').getFullList({ filter }).catch(() => []),
      pb.collection('rkc_ccr_material_usage').getFullList({ filter }).catch(() => []),
      pb.collection('rkc_ccr_parameter_data').getFullList({ filter }).catch(() => []),
      pb.collection('rkc_ccr_silo_data').getFullList({ filter }).catch(() => [])
    ]);

    // Merge everything
    const allDowntime = [...downtime, ...rkcDowntime];
    const allInfo = [...info, ...rkcInfo];
    const allMaterial = [...material, ...rkcMaterial];
    const allParams = [...params, ...rkcParams];
    const allSilo = [...silo, ...rkcSilo];

    // Map Parameter Names
    const paramMap = new Map();
    paramSettings.forEach(p => paramMap.set(p.id, p.parameter));

    // 6. Aggregate Data by Unit
    const unitData = {};
    allUnits.forEach(u => {
      unitData[u.unit] = {
        downtime: allDowntime.filter(d => d.plant_unit === u.unit || d.unit === u.unit),
        info: allInfo.filter(i => i.plant_unit === u.unit),
        material: allMaterial.filter(m => m.plant_unit === u.unit),
        params: allParams.filter(p => p.plant_unit === u.unit || (paramSettings.find(s => s.id === p.parameter_id)?.unit === u.unit)),
        silo: allSilo.filter(s => {
          // silo data usually linked via silo_id? We skip for now or just give raw if available
          return true; // Simplified
        }),
        capacity: capacity.filter(c => c.plant_unit === u.unit)
      };
    });

    // 7. Prepare Prompt
    console.log('Preparing AI prompt...');
    const dataSummary = JSON.stringify({
      date: dateStr,
      units: allUnits.map(u => {
        const name = u.unit;
        const d = unitData[name];
        return {
          name,
          has_data: (d.material.length > 0 || d.downtime.length > 0 || d.info.length > 0 || d.capacity.length > 0),
          total_production: d.material.reduce((sum, m) => sum + (m.total_production || 0), 0),
          downtime: d.downtime.map(dt => ({ problem: dt.problem, duration: dt.duration, status: dt.status })),
          info: d.info.map(i => i.information),
          capacity: d.capacity.map(c => ({ wet: c.wet, dry: c.dry, moisture: c.moisture }))
        };
      })
    }, null, 2);

    const prompt = `
      You are an expert Cement Plant Operations Analyst.
      Analyze the operational data for the date: ${dateStr}.
      
      Operational Data Summary:
      ${dataSummary}
      
      Task:
      Generate a daily operational review and recommendations for EVERY plant unit listed in the data summary above (${allUnits.map(u => u.unit).join(', ')}).
      
      CRITICAL INSTRUCTIONS:
      1. You MUST return exactly one review object for EACH of the 11 units: ${allUnits.map(u => u.unit).join(', ')}.
      2. If a unit has "has_data: false" or zero production/info, you must still provide a review stating that no operational data was recorded for this day, and recommend checking data entry or maintenance status.
      3. The response MUST be a JSON object with a "reviews" key containing an array of 11 objects.
      
      Output Format:
      {
        "reviews": [
          {
            "plant_unit": "Unit Name",
            "review_content": "A detailed review of the operations, efficiency, and any issues found.",
            "recommendations": "Actionable recommendations for improvement.",
            "metrics_summary": {
               "total_production": 0,
               "downtime_hours": 0,
               "efficiency_score": 0
            }
          }
        ]
      }
      
      Language: Technical Indonesian.
      Keep the tone professional and data-driven.
    `;

    // 8. Call x.AI
    console.log('Requesting x.AI Review...');
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a Cement Plant Operations Expert.' },
          { role: 'user', content: prompt }
        ],
        model: 'grok-4-1-fast-reasoning',
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`x.AI API Error: ${errText}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices[0].message.content;
    console.log('AI Response Content:', content);
    const parsedContent = JSON.parse(content);
    
    let reviews = [];
    if (Array.isArray(parsedContent)) {
      reviews = parsedContent;
    } else if (parsedContent.reviews && Array.isArray(parsedContent.reviews)) {
      reviews = parsedContent.reviews;
    } else if (typeof parsedContent === 'object' && parsedContent !== null) {
      if (parsedContent.plant_unit) {
        reviews = [parsedContent];
      } else {
        // Look for any array in the object
        const firstArrayKey = Object.keys(parsedContent).find(k => Array.isArray(parsedContent[k]));
        if (firstArrayKey) {
          reviews = parsedContent[firstArrayKey];
        } else {
          reviews = [parsedContent];
        }
      }
    }

    // 9. Store in PocketBase
    console.log('Storing reviews in PocketBase...');
    for (const review of reviews) {
      console.log('Processing review for:', review.plant_unit);
      // Check if already exists
      const existing = await pb.collection('operational_ai_reviews').getFullList({
        filter: `date="${dateStr} 00:00:00" && plant_unit="${review.plant_unit}"`
      });

      const payload = {
        date: dateStr,
        plant_unit: review.plant_unit,
        review_content: review.review_content,
        recommendations: review.recommendations,
        metrics_summary: review.metrics_summary
      };

      if (existing.length > 0) {
        await pb.collection('operational_ai_reviews').update(existing[0].id, payload);
      } else {
        await pb.collection('operational_ai_reviews').create(payload);
      }
    }

    console.log('--- AI Operational Review Process Completed ---');

  } catch (error) {
    console.error('FAILED TO GENERATE REVIEW:', error);
  }
}

generateReview();
