const { Pool } = require('pg');

const pool = new Pool({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    user: 'postgres.vkgjvslafnshlsrrcrar',
    password: 'Melpost123@',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: 'Make sure you GET this endpoint' };
    }

    const { period } = event.queryStringParameters || { period: 'today' };

    try {
        let dateFilter = '';

        switch (period) {
            case 'today':
                dateFilter = "WHERE c.created_at >= CURRENT_DATE";
                break;
            case 'yesterday':
                dateFilter = "WHERE c.created_at >= CURRENT_DATE - INTERVAL '1 day' AND c.created_at < CURRENT_DATE";
                break;
            case 'week':
                dateFilter = "WHERE c.created_at >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case 'all':
                dateFilter = "";
                break;
            default:
                dateFilter = "WHERE c.created_at >= CURRENT_DATE";
        }

        const query = `
            SELECT 
                c.id,
                c.slug,
                c.country,
                c.ip_address,
                c.created_at,
                c.click_id,
                c.os,
                c.user_agent,
                l.original_url
            FROM clicks c
            LEFT JOIN links l ON c.link_id = l.id
            ${dateFilter}
            ORDER BY c.created_at DESC
            LIMIT 500
        `;

        const result = await pool.query(query);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                clicks: result.rows.map(row => ({
                    id: row.id,
                    slug: row.slug,
                    country: row.country,
                    ip: row.ip_address,
                    time: row.created_at,
                    clickId: row.click_id,
                    os: row.os || 'Unknown',
                    originalUrl: row.original_url
                }))
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch reports' })
        };
    }
};
