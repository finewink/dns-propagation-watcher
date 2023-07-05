const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('moment-timezone');

var moment = require('moment');
moment.tz.setDefault("Asia/Seoul");
exports.moment = moment;

const logDir = "./logs";


const config = { 
    levels: { // 숫자가 낮을 수록 우선순위가 높습니다.
        error: 0,
        debug: 1,
        warn: 2,
        info: 3,
        data: 4,
        verbose: 5,
        silly: 6,
        custom: 7
    },
    colors: { // 각각의 레벨에 대한 색상을 지정해줍니다.
        error: 'red',
        debug: 'blue',
        warn: 'yellow',
        info: 'green',
        data: 'magenta',
        verbose: 'cyan',
        silly: 'grey',
        custom: 'yellow'
    }
}

winston.addColors(config.colors); // 컬러를 적용하는 부분인 듯합니다.

const timezoned = () => {
    return moment().format(); 
    // new Date().toLocaleString('ko-KR', {
    //     timeZone: 'Asia/Seoul'
    // });
}

// const format = winston.format.combine(
//     winston.format.timestamp({ format: " YYYY-MM-DD HH:mm:ss ||" }),
//     winston.format.printf(
//       (info) => `${info.timestamp} ${info.level} | ${info.message}`
//     )
//   );

// const transport = new DailyRotateFile({
//     filename: `${logDir}/%DATE%.log`,
//     datePattern: "YYYYMMDD",
//     zippedArchive: true,
//   });

// format 객체를 작성해줍니다. 
const format = winston.format.combine( 
    // appendTimestamp,
    winston.format.timestamp({ format: timezoned }),
    //winston.format.colorize({ all: true }), // 색상의 적용 범위입니다.
    // winston.format.printf( // printf 양식은 입맛에 맞게 바꿀 수 있습니다.
    //     (info) => `[${info.level}][${info.timestamp}] ▶ ${info.message}`,
    // ),
    
    
    winston.format.json()
    
)

// logger 객체를 생성해줍니다.
const logger = winston.createLogger({
    levels: config.levels,
    format,
    level: 'custom', 
    transports: [
        new winston.transports.Console(),
        // transport
    ],
});

logger.stream = {
    write: function(message, encoding) {
      logger.info(message); // 단순히 message를 default 포맷으로 출력
    },
};

// logger.error("error Level, This is Logging System!");
// logger.debug("Debug Level, This is Logging System!");
// logger.warn("Warn Level, This is Logging System!");
// logger.info("Info Level, This is Logging System!");
// logger.data("Data Level, This is Logging System!");
// logger.verbose("Verbose Level, This is Logging System!");
// logger.silly("Silly Level, This is Logging System!");
// logger.custom("Custom Level, This is Logging System!");

module.exports = logger;