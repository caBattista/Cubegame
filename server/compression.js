Base = {
    _Rixits:
        //   0       8       16      24      32      40      48      56     63  ....         87
        //   v       v       v       v       v       v       v       v      v
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*,/.:;<=>?@^_`{|}~",

    _Base: 87,
    fromInt(intNum) {//Kills leading 0!!!
        var result = '';
        var rixit; // like 'digit', only in some non-decimal radix 
        var residual = Math.floor(intNum);
        while (true) {
            rixit = residual % this._Base;
            result = this._Rixits.charAt(rixit) + result;
            residual = Math.floor(residual / this._Base);
            if (residual == 0) break;
        }
        return result;
    },
    fromNumber: function (number) {
        if (isNaN(Number(number)) || number === null ||
            number === Number.POSITIVE_INFINITY)
            throw "The input is not valid";
        var numberParts = number >= 0 ? number.toString().split(".") : Math.abs(number).toString().split(".");
        var result = this.fromInt(parseInt(numberParts[0]));
        if (numberParts.length === 2) {
            return result + (number >= 0 ? "+" : "-") + this.fromInt(parseInt(numberParts[1]));
        } else {
            return result + (number >= 0 ? "" : "-");
        }
    },
    toInt(intString) {
        var result = 0;
        rixits = intString.split('');
        for (var e = 0; e < rixits.length; e++) {
            result = (result * this._Base) + this._Rixits.indexOf(rixits[e]);
        }
        return result;
    },
    toNumber: function (rixits) {
        var minusIndex = rixits.indexOf("-");
        var plusIndex = rixits.indexOf("+");
        if ((minusIndex === -1 && plusIndex === -1)) {//positive non decimal number
            return this.toInt(rixits);
        } else if (minusIndex === rixits.length - 1) {//negative non decimal number
            return this.toInt(rixits.slice(0, -1)) * -1;
        } else if (plusIndex !== -1) {//positive decimal number
            var numberParts = rixits.split("+");
            return parseFloat(this.toInt(numberParts[0]) + "." + this.toInt(numberParts[1]));
        } else if (minusIndex !== -1) {//negative decimal number
            var numberParts = rixits.split("-");
            return parseFloat(this.toInt(numberParts[0]) + "." + this.toInt(numberParts[1])) * -1;
        } else { throw "The input is not valid"; }
    },
    getChars(from = 32, to = 126) {
        s = '';
        for (var i = from; i <= to; i++) {
            s += String.fromCharCode(i);
        }
        return s;
        //' !"#$%&\\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
    }
}


let nums = [];
for (let i = 0; i < 1000000; i++) {
    nums.push((Math.random() * 10000000) - 5000000);
}

(async function () {//this is actually faster WTF!!!
    let fa = JSON.stringify(nums);

    const cs = new CompressionStream("deflate");
    const writer = cs.writable.getWriter();
    writer.write(new TextEncoder().encode(fa));
    writer.close();
    let comp = await new Response(cs.readable).arrayBuffer();

    const dcs = new DecompressionStream("deflate");
    const dwriter = dcs.writable.getWriter();
    dwriter.write(comp);
    dwriter.close();
    let decomp = new TextDecoder().decode(await new Response(dcs.readable).arrayBuffer());


    let res = JSON.parse(decomp)
    console.log(comp, res);
})();

(async function () {
    let fa = new Float64Array(nums);

    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(fa);
    writer.close();
    let comp = await new Response(cs.readable).arrayBuffer();

    const dcs = new DecompressionStream("gzip");
    const dwriter = dcs.writable.getWriter();
    dwriter.write(comp);
    dwriter.close();
    let decomp = await new Response(dcs.readable).arrayBuffer()

    let res = new Float64Array(decomp);//kills decimals!!!
    console.log(comp, res);
})();

