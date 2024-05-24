import Compatibility from './compatibility';
import IDE from './ide/ide';

//Start initialization after the entire page is loaded
window.addEventListener('load', e => {
    new IDE();
});

Compatibility.registerClasses();