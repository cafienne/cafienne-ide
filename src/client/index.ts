import Compatibility from './compatibility/compatibility';
import IDE from './ide/ide';

// Constructors of some classes must still be available as global pointers on the window element :(
Compatibility.registerClasses();

// Start initialization after the entire page is loaded
window.addEventListener('load', e => new IDE());
