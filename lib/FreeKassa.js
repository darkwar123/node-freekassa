const md5 = require('md5');
const events = require('events');
const request = require('request');
const eventEmitter = new events.EventEmitter();
const hash = (...args) => require('crypto').createHash('md5').update((args.join(':'))).digest("hex");

const methods = {
	'qiwi': 63,
	'yandex': 45,
};

function FreeKassa({ walletId, walletSecret } = {}) {
	this.walletId = walletId;
	this.walletSecret = walletSecret;
}

FreeKassa.prototype.withdraw = function({ method, amount, address } = {}) {
	return new Promise((resolve, reject) => {
		method = methods[method];

		if (!method) {
			return reject('unknown withdraw method');
		}

		request({
			url: 'https://www.fkwallet.ru/api_v1.php',
			method: 'POST',
			form: {
				wallet_id: this.walletId,
				purse: address,
				amount: amount,
				currency: method,
				action : 'cashout',
				sign: md5(this.walletId + method + amount + address + this.walletSecret),
			},
			json: true,
		}, (err, response, body) => {
			body = body || {};

			if (err || response.statusCode !== 200 || body.status === 'error') {
				return reject(new Error('payment declined'));
			}

			return resolve(body);
		});
	});
};

FreeKassa.ipn = function({ merchantId, merchantSecret } = {}) {
	return (req, res, next) => {
		const { AMOUNT, MERCHANT_ORDER_ID, SIGN } = req.query;
		const REAL_SIGN = hash(merchantId, AMOUNT, merchantSecret, MERCHANT_ORDER_ID);

		if (SIGN !== REAL_SIGN) {
			return next(new Error('FREEKASSA_SIGN_MISMATCH'));
		}

		this.emit('ipn_complete', req.query);

		next();
	}
}.bind(eventEmitter);

FreeKassa.events = eventEmitter;

module.exports = FreeKassa;