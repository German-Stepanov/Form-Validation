var FormValidation = function (arg) {
	arg = arg instanceof Object ? arg : {};
	
	//Текущий объект
	var self = this;
	//Правила валидации
	this.rules = {};
	
	//Асинхронная функция перебора ключей объекта
	var eachObjectKey = async function(p, obj, f, next) {
		var promises = [];
		for (var key in obj) {
			if (p=='await') {
				//Последовательно (in order)
				promises.push(await new Promise( (resolve, reject) => f(key, obj[key], resolve)));
			} else {
				//Параллельно (in parallel)
				promises.push(new Promise( (resolve, reject) => f(key, obj[key], resolve)));
			}
		}
		await Promise.all(promises).then(next);
	};
	
	this.errors = {
		//Оформление ошибок
		before 	: '',				//Перед ошибкой
		after	: '',				//За ошибкой
		join	: '<br/>',			//Разделитель ошибок
		class	: 'form_error',		//Класс тегов ошибок
		elements: [],
		ru 	: {
			no_empty 	: 'Поле обязательно для заполнения',
			number		: 'Поле не содержит только цифры и/или знак минус',
			integer		: 'Поле не содержит положительное целое число',
			real		: 'Поле не содержит число с точкой',
			email		: 'Поле не содержит адрес электронной почты',
			phone		: 'Поле не содержит номер телефона в формате +79991112233',
		},
		en	: {
			no_empty 	: 'Required field',
			number		: 'Number field. Enter the correct number',
			integer		: 'Positive number field. Enter the correct number',
			real		: 'Dotted number field. Enter the correct number',
			email		: 'Email field. Enter the correct address',
			phone		: 'Phone field. Enter the correct phone number',
		},
		clear : function() {
			for (var i=0; i<self.errors.elements.length; i++) self.errors.elements[i].innerHTML = '';			
		}
	};
	if (arg.form) this.errors.elements = arg.form.getElementsByClassName(self.errors.class);

	//Язык
	var lang = document.querySelector('html').lang;
	lang = lang && this.errors[lang] ? lang : 'ru';

	//Коллекция стандартных правил
	this.rule = {
		no_empty: (value, next) => next (!value || value.length==0 ? self.errors[lang].no_empty : null),
		number 	: (value, next) => next (/^\-?\d+$/.test(value.toString()) ? null : self.errors[lang].number),
		integer : (value, next) => next (/^\d+$/.test(value.toString()) ? null : self.errors[lang].integer),
		real	: (value, next) => next (/^\-?\d+?(?:\.\d+|$)/.test(value.toString()) ? null : self.errors[lang].real),
/*		email   : (value, next) => next ( /^[-._a-z0-9]+@(?:[a-z0-9][-a-z0-9]+\.)+.[a-z]{2,6}$/.test(value.toString()) ? null : self.errors[lang].email),*/
		email   : (value, next) => next ( /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value.toString()) ? null : self.errors[lang].email),
		phone   : (value, next) => next (/^\+[\d]{10,14}\d$/.test(value.toString()) ? null : self.errors[lang].phone),
	};

	if (!arg.form) return console.error('ERROR FormValidation: Form not defined');
	
	//Старт валидации
	this.run = function (next) {
		//Формируем группы правил из одиночных правил
		for (var fieldname in this.rules) {
			if (!(this.rules[fieldname] instanceof Array)) {
				this.rules[fieldname] = [this.rules[fieldname]];
			};
		};
		//Данные полей ввода с учетом возможных скобок
		var values = {};
		var formData = new FormData(arg.form);
		for (let [name, value] of formData) {
			if (/\[\]$/.test(name)) {
				if (!values[name]) values[name] = [];
				if (value instanceof File && value.name=="") continue;
				values[name].push(value);
			} else {
				values[name] = value;
			};
		};
		
		eachObjectKey( 'not await', this.rules,
			function (fieldname, group, next_group) {
				//Перебор правил в группе
				eachObjectKey( 'not await', group,
					function (key, rule, next_rule) {
						//Получение ошибки валидации из функции правила
						//Сохраняем ошибку, переназначаем this для результата и обрабатываем следующее правило
						rule.call (arg.form, values[fieldname], next_rule);							
					},
					function (errors) {
						//Удаляем пустые ощибки
						//Сохраняем результат и обрабатываем следующую группу
						next_group({fieldname:fieldname, errors:errors.filter((error) => error!=null)});
					}
				);
			},
			function (results) {
				//Флаг завершения 
				var success = true;
				//Показываем или очищаем все сообщения об ошибках
				results.forEach((result) => {
					var items = arg.form.getElementsByClassName(self.errors.class + ' ' + result.fieldname);
					//Оборачиваем каждую ошибку в теги
					for(var key in result.errors) {
						result.errors[key] = self.errors.before + result.errors[key] + self.errors.after;
					};
					//Объединяем ошибки через тег
					if (items[0]) items[0].innerHTML = result.errors.join(self.errors.join);
					if (success && result.errors.length>0) success = false;
				});
				next(success);
			}
		);
	};

	//Если кнопка Reset не заявлена
	var reset = arg.form.querySelector('[type="reset"]');
	reset.onclick = this.errors.clear;
	//Если заявлена кнопка Reset
	if (arg.reset && arg.reset!=reset) arg.reset.onclick = this.errors.clear;

	//Перехват события отправки формы и валидация
	arg.form.onsubmit =  function(event) {
		self.run( function (success) {
			if (!success) return event.preventDefault();
			//Если есть функция обработки отправки формы
			if (typeof(arg.onsubmit)=='function') {
				event.preventDefault();
				return arg.onsubmit();
			};
		});
	};

};
