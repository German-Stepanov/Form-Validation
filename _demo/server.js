//Устанавливаем конфигурацию (глобальная)
myConfig = {};
//Конфигурация сервера 
myConfig.server = {
	port		: 2020,
	isDebug		: true,		//Сообшения сервера
};
//Конфигурация модуля Static
myConfig.static = {
	//Запрет доступа
	forbidden	: [ '/server.js', '/node_modules/' ],
	//Очищаемые от комментариев файлы (js или css)
	clear		: ['/js/FormValidation.js', '/css/style.css'],	
	//Список mime						
	mime		: require('output-static-mime'),	
	//Режим отладки (добавлять ошибки заппросов в лог)
	isDebug		: true,
};

//Конфигурация модуля Input
myConfig.input = {
	//Папка временных файлов
	tmpDir 		: __dirname + '/node_modules/app/_tmp/',
	//Ограничение данных, байт (0-без ограничения)			
	maxSize		: 0,
	//Срок хранения временных файлов, сек					
	storageTime	: 5*60, 					
	//Режим отладки
	isDebug		: false,						
};
//Конфигурация модуля Output
myConfig.output = {
	//Папка отображений (Абсолюьный адрес)
	dir 		: __dirname + '/node_modules/app/views/',
	//Очищать код		
	clear 		: true,
	//Режим отладки
	isDebug		: false,						
};
//Конфигурация модуля "router-controller"
myConfig.router = {
	//Папка контроллеров (Абсолюьный адрес)
	dir			: __dirname + '/node_modules/app/controllers/',
	//Статичныее маршруты
	routes 		: {	
		//Запрос / обрабатывает контроллер /home.js или /home/index.js
		'/'			: '/home',	
	},
	//Режим отладки (добавлять отладочную информацию в лог)
	isDebug		: false,
	//Не кэшировать
	noCache		: false,
};

//Модуль фильтрации разрешенных статических ресурсов
var static 	= require('output-static')(myConfig.static);
//Модуль получения данных
var input 	= require('input-formdata')(myConfig.input);
//Модуль вывода шаблонов
var output 	= require('output-view')(myConfig.output);
//Модуль роутера
var router 	= require('router-controller').router(myConfig.router);
//Переназначаем базовый контроллер
router.Controller = require('app/controllers/MyController.js');

//Формируем задачу
var app = function(req, res) {
	//Исправления национальных букв адресной строки
	req.url = require('querystring').unescape(req.url);

	//Фильтруем запросы статических файлов
	static.filter (req, res, function (err) {
		if (!err) return;
		
		if (err.code>1) {
			//Запрашиваемый ресурс не существует, не найдено mime или запрещен к нему доступ
			if (myConfig.static.isDebug) console.log('STATIC ERROR:', static.errors[err.code], '"' + err.file + '"');
			res.writeHead(404);
			res.end();
			return;
		}

			if (myConfig.server.isDebug) {
				console.log('\nПолучен запрос req.url', req.url);
				console.time('app');	//Установим метку времени
			}

			//Подключаем и запускаем модуль Input
			input.start (req, res, function () {

				if (myConfig.server.isDebug) {
					console.log('Получены данные ' + req.method + ':', req.input.toString());
				}

				//Подключаем и запускаем модуль Output
				req.output = output;

				//Ищем и запускаем контроллер
				var controller = router.getController(req, res);
				controller.start(function () {
					//Выводим общее время выполнения
					if (myConfig.server.isDebug) console.timeEnd('app');
				});

			});
	});
};
//Создаем и запускаем сервер для задачи
var server = require('http').createServer(app);
server.listen(myConfig.server.port);
//Отображаем информацию о старте сервера
if (myConfig.server.isDebug) console.log('Server start on port ' + myConfig.server.port + ' ...');
