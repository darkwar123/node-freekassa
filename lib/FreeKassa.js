const events = require('events');
const eventEmitter = new events.EventEmitter();
const hash = (...args) => require('crypto').createHash('md5').update((args.join(':'))).digest("hex");

function FreeKassa() {}

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