import Navitems from "@/components/nav-items"
import Navsignin from "@/components/nav-signin"

export default function Nav() {
    
    return (
        <nav>
            <ul style={{ display: 'flex', listStyle: 'none', padding: 0 }}>
            <Navitems />
            <Navsignin />
            </ul>
        </nav>
    );
}