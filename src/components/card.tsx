export const Card = ({ children }: { children: React.ReactNode }) => {
    const cardStyle = {
        padding: '1rem',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        margin: '1rem auto',
    };

    return <div style={cardStyle}>{children}</div>;
};