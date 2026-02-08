import { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
    const [period, setPeriod] = useState('today');
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async (selectedPeriod) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/get-clicks-report?period=${selectedPeriod}`);
            if (response.ok) {
                const data = await response.json();
                setClicks(data.clicks || []);
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(period);
    }, [period]);

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const getCountryFlag = (country) => {
        if (!country || country === 'XX') {
            return <span style={{ fontSize: '1.2rem' }}>🌍</span>;
        }
        return (
            <img
                src={`https://flagcdn.com/24x18/${country.toLowerCase()}.png`}
                alt={country}
                style={{ width: '24px', height: '18px', borderRadius: '2px', verticalAlign: 'middle' }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    };

    const getOSIcon = (os) => {
        const icons = {
            'iOS': '🍎',
            'Android': '🤖',
            'Windows': '🪟',
            'Windows Phone': '📱',
            'macOS': '🍏',
            'Linux': '🐧',
            'Chrome OS': '💻',
            'Unknown': '❓'
        };
        return icons[os] || '❓';
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Traffic Reports</h2>
                <div className="period-filters">
                    {['today', 'yesterday', 'week', 'all'].map((p) => (
                        <button
                            key={p}
                            className={`filter-btn ${period === p ? 'active' : ''}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="reports-card">
                {loading ? (
                    <div className="loading-state">Loading data...</div>
                ) : clicks.length === 0 ? (
                    <div className="empty-state">No data found for this period</div>
                ) : (
                    <div className="table-responsive">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Click ID</th>
                                    <th>Country</th>
                                    <th>OS</th>
                                    <th>IP Address</th>
                                    <th>Slug</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clicks.map((click) => (
                                    <tr key={click.id}>
                                        <td>{formatTime(click.time)}</td>
                                        <td className="mono">{click.clickId || '-'}</td>
                                        <td>
                                            <div className="flex-center">
                                                {getCountryFlag(click.country)}
                                                <span style={{ marginLeft: '8px' }}>{click.country}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-center">
                                                <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{getOSIcon(click.os)}</span>
                                                {click.os}
                                            </div>
                                        </td>
                                        <td className="mono">{click.ip}</td>
                                        <td className="slug-cell" title={click.originalUrl}>{click.slug}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
