const codemap = "c3D1RFP9eM[UjINfOZi0Qg+mhkxSJ5p* uX8B}`-rs,LqAH@lnbVT.C{z4YWtGv72^/aw|do_6\\yE~]K";

function decrypt(text, seed) {
    let crypted = "";
    for (let n = 0; n < text.length; n++) {
        const ascii = text.charCodeAt(n);
        let s;
        
        if (ascii === 32) {
            s = 0;
        } else if (ascii >= 42 && ascii <= 57) {
            s = ascii - 41;
        } else if (ascii >= 64 && ascii <= 126) {
            s = ascii - 47;
        } else {
            s = null;
        }

        if (s !== null) {
            s = (s + n + seed) % 80;
            crypted += codemap.charAt(s);
        }
    }
    return crypted;
}