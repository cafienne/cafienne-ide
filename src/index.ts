import Compatibility from './compatibility/compatibility';
import IDE from './ide/ide';

//Start initialization after the entire page is loaded
window.addEventListener('load', e => {
    // For now create a global IDE pointer.
    console.log("Creating IDE")
    const ide = new IDE();
    ide.init();
});

Compatibility.registerClasses();
