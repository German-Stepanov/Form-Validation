# Form-Validation
Валидация формы на стороне клиента
```
Используются любые асинхронные одиночные правила или группы правил проверки полей.
После проверки отправляет форму или передает управление функции отправки формы (если указана)
```

## Пример страницы с формой
```HTML
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <title>Home</title>
	<script src="/js/jquery-3.4.0.min.js"></script>
    <link rel="stylesheet" href="/css/style.css">
    <!-- Класс валидации форм -->
    <script type="text/javascript" src="/js/FormValidation.js"></script>
</head>
<body>

<style>
	.form_error {
		color 			: red;
	}
	.form_success {
		display			: none;
		background-color: lightblue;
		color			: white;
		padding			: 10px
	}
</style>
<form name="my_form" action="/send" method="post" enctype="multipart/form-data">

    <input type="text" name="user_name" placeholder="User Name"/>
    <div class="form_error user_name"></div>

    <input type="checkbox" name="user_company[]" value="Company1"/>Company1
    <input type="checkbox" name="user_company[]" value="Company2"/>Company2
    <input type="checkbox" name="user_company[]" value="Company3"/>Company3
    <div class="form_error user_company[]"></div>

    <input type="email" name="user_email" placeholder="User Email"/>
    <div class="form_error user_email"></div>

    <input type="radio" name="user_phone" value="111-22-33"/>111-22-33
    <input type="radio" name="user_phone" value="222-33-44" checked/>222-33-44
    <input type="radio" name="user_phone" value="333-44-55"/>333-44-55
    <div class="form_error user_phone"></div>

    <input type="file" name="user_file[]" multiple/>
    <div class="form_error user_file[]"></div>

    <textarea name="user_text" rows="5" placeholder="User Text"></textarea>
    <div class="form_error user_text"></div>

    <button type="submit">Отправить</button>
    <button type="reset">Reset</button>
    
    <div class="form_success">Успешно отправлено</div>
</form>
</body>
</html>
```
## Использование
```JS
<script>
//Создание экземпляра
var validation = new FormValidation ({
	form		: $('form[name="my_form"]')[0],
	//При успехе
	onsubmit 	: function() {
		console.log('send_form');
		$('.form_success').show();
	},
});
//Правила валидации
validation.rules = {
	'user_name'			: validation.rule.no_empty,
	'user_company[]'	: [
		validation.rule.no_empty,
		function(values, next) {
			//console.log(values);
			if (!values) return next();
			if (values.indexOf('Company2')!=-1) return next('Вам запрещено выбирать Company2');
			next();
		},
	],
	'user_phone'	: function(value, next) {
		var companies = $(this).find('input[name="user_company[]"]:checked');
		for (var i=0; i<companies.length; i++) {
			if ($(companies[i]).val()=='Company1' && value=='222-33-44') {
				return next('Ошибка телефона');
			}
		}
		next();
	},
	'user_email' 	: validation.rule.no_empty,
	'user_file[]' 	: [
		validation.rule.no_empty,
		function(values, next) {
			//console.log(values);
			if (!values) return next();
			var errors = [];
			for (var key in values) {
				if (values[key] && values[key].size>400*1024) errors.push('Размер файла ' + values[key].name + ' превышает 400 кб');
			}
			next(errors.length==0 ? null : errors.join('<br>'));
		}
	],
	'user_text' 	: validation.rule.no_empty,
};
</script>
```