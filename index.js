const HISTORY_LENGTH = 3;
const USER = '';
const PASS = '';
const HOST = '';

let History = {};

function getHistoryByLp() {
    const flatHistory = Object.values(History);
    let result = [];

    flatHistory.forEach((lp) => {
        result.push(lp[0]);
    });

    return result;
};

function updateHistoryPrices(price) {
    if (!History.hasOwnProperty(price.lp)) {
        History[price.lp] = []
    }

    if (History[price.lp].length == HISTORY_LENGTH) {
        History[price.lp].pop();
    }

    History[price.lp].unshift(price);
}

function renderHistory(lp) {
    const template = document.getElementById('template_history').innerHTML;
    const rendered = Mustache.render(template, { history: getHistoryByLp() });
    document.getElementById('target_history').innerHTML = rendered;
}

function animateChange(side, lp) {
    if (History[lp].length < 2) {
        return
    }

    let sideLp = side + '-' + lp
    let style = 'table-success';

    const td = document.getElementById(sideLp);

    if (History[lp][0][side] < History[lp][1][side]) {
        style = 'table-danger'
    } else if (History[lp][0][side] > History[lp][1][side]) {
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

    updateHistoryPrices(price);

    // async to offload the computation
    setTimeout(() => {
        renderHistory();
        animateChange('bid', price.lp);
        animateChange('ask', price.lp);
    }, 0);
});









