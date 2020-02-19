const HISTORY_LENGTH = 3;
let HOST = '45.32.179.168';
let USER = 'username';
let PASS = 'password';
let HISTORY = {};

function getHistoryByLp() {
    const flatHistory = Object.values(HISTORY);
    let result = [];

    flatHistory.forEach((lp) => {
        result.push(lp[0]);
    });

    return result;
}

function updateHistoryPrices(price) {
    if (!HISTORY.hasOwnProperty(price.lp)) {
        HISTORY[price.lp] = []
    }

    if (HISTORY[price.lp].length == HISTORY_LENGTH) {
        HISTORY[price.lp].pop();
    }

    HISTORY[price.lp].unshift(price);
}

function renderHistory(lp) {
    const template = document.getElementById('template_history').innerHTML;
    const rendered = Mustache.render(template, { history: getHistoryByLp() });
    document.getElementById('target_history').innerHTML = rendered;
}

function animateChange(side, lp) {
    if (HISTORY[lp].length < 2) {
        return
    }

    let sideLp = side + '-' + lp
    let style = 'table-success';

    const td = document.getElementById(sideLp);

    if (HISTORY[lp][0][side] < HISTORY[lp][1][side]) {
        style = 'table-danger'
    } else if (HISTORY[lp][0][side] > HISTORY[lp][1][side]) {
        style = 'table-success'
    } else {
        style = 'table-active'
    }

    td.classList.add(style);

    setTimeout(() => {
        td.classList.remove(style);
    }, 650);
}

const nats = NATS.connect({ url: 'ws://' + HOST + ':8910/nats', user: USER, pass: PASS });
nats.subscribe('arbito.prices.*', (msg, reply, subj) => {
    let price = JSON.parse(msg);
    let subjSplit = subj.split('.');
    price.lp = subjSplit[subjSplit.length - 1];
    price.timestamp = moment().format();
    price.bid = price.bid.toFixed(5);
    price.ask = price.ask.toFixed(5);
    price.spread = (price.ask - price.bid).toFixed(5);

    updateHistoryPrices(price);

    // async to offload the computation
    setTimeout(() => {
        renderHistory();
        animateChange('bid', price.lp);
        animateChange('ask', price.lp);
    }, 0);
});