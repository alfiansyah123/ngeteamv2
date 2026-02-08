import { useState, useEffect } from 'react';
import './LiveTraffic.css';
import androidIcon from '../assets/android-icon.png';
import appleIcon from '../assets/apple-icon.png';
import windowsIcon from '../assets/windows-icon.png';

const LiveTraffic = () => {
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClicks = async () => {
        try {
            const response = await fetch('/api/get-recent-clicks');
            if (response.ok) {
                const data = await response.json();
                setClicks(data.clicks || []);
            }
        } catch (err) {
            console.error('Failed to fetch clicks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClicks();
        const interval = setInterval(fetchClicks, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const getCountryFlag = (country) => {
        if (!country || country === 'XX') {
            return <span style={{ fontSize: '1.2rem' }}>🌍</span>;
        }
        return (
            <img
                src={`https://flagcdn.com/24x18/${country.toLowerCase()}.png`}
                alt={country}
                style={{ width: '24px', height: '18px', borderRadius: '2px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    };

    const getOSIcon = (os) => {
        const iconStyle = { width: '16px', height: '16px', verticalAlign: 'middle' };

        switch (os) {
            case 'iOS':
            case 'macOS':
                return <img src={appleIcon} alt={os} style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
            case 'Windows':
            case 'Windows Phone':
                return <img src={windowsIcon} alt={os} style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
            case 'Android':
                return <img src={androidIcon} alt="Android" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
            case 'Linux':
                return <svg style={iconStyle} viewBox="0 0 512 512" fill="currentColor"><path d="M512 32c0 17.7-14.3 32-32 32H32C14.3 64 0 49.7 0 32S14.3 0 32 0h448c17.7 0 32 14.3 32 32zm0 32v96H0V64h512zm0 128v224H0V192h512z" /></svg>; // Terminal icon for generic *nix
            default:
                return <svg style={iconStyle} viewBox="0 0 512 512" fill="currentColor"><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" /></svg>;
        }
    };

    if (loading) {
        return (
            <div className="live-traffic">
                <div className="live-traffic-header">
                    <span className="live-dot"></span>
                    <h3>Live Traffic</h3>
                </div>
                <div className="traffic-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="live-traffic">
            <div className="live-traffic-header">
                <span className="live-dot"></span>
                <h3>Live Traffic</h3>
                <span className="traffic-count">{clicks.length} recent</span>
            </div>

            <div className="traffic-list">
                {clicks.length === 0 ? (
                    <div className="no-traffic">No traffic yet</div>
                ) : (
                    clicks.map((click, index) => (
                        <div
                            key={click.id}
                            className="traffic-item"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="traffic-icons">
                                <span className="traffic-flag" title={click.country}>{getCountryFlag(click.country)}</span>
                                <span className="traffic-os" title={click.os}>{getOSIcon(click.os)}</span>
                            </div>
                            <div className="traffic-info">
                                <span className="traffic-slug" title={click.clickId || click.slug}>
                                    {click.clickId || `/${click.slug}`}
                                </span>
                                <div className="traffic-meta">
                                    <span className="traffic-ip">{click.ip}</span>
                                    <span className="traffic-time">{formatTime(click.time)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LiveTraffic;
