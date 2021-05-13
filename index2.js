const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const file = 'olds.json';

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin())
//const dotenv = require('dotenv').config();
const { Webhook, MessageBuilder } = require('discord-webhook-node');


const launchBrowser = async (_headless = false) => {
    return await new Promise(async resolve => {
    	var browser = await puppeteer.launch({headless: _headless});
    	var page = await browser.newPage();
    	resolve([browser, page])
    })
};

const pagesNumber = async(page) => {
	return page.evaluate(async () => { 
	    return await new Promise(async resolve => {
	    	var last_page = document.getElementsByClassName('is-gridwall-pagination__next-double')[0].getElementsByTagName('a')[0].getAttribute('href');
	    	last_page = last_page.substring(last_page.length-2);
	    	if (last_page.indexOf('=') != 1){
	    		last_page = last_page.replace('=', '');
	    	}
	    	last_page = parseInt(last_page);
	    	resolve(last_page); 
	    })
	})
};

const getCurrentPageItems = async(page) => {
	return page.evaluate(async () => { 
	    return await new Promise(async resolve => {
	    	pageItems = document.getElementsByClassName('is-pw__product');
	    	var items = [];
    		for (j = 0; j < pageItems.length; j++){
	    		var current = document.getElementsByClassName('is-pw__product')[j].getElementsByClassName('js-gtm-product-click')[0];
		    		const new_item = async (current) => {
		    			return await new Promise(resolve => {
			    			const tmp = {};
			    			var title = current.getAttribute('data-productname');
			    			var code =  current.getAttribute('data-productcode');
			    			
			    			tmp.title = title;
			    			tmp.code = code;

			    			var toSearch1 = title.toLowerCase();
			    			toSearch1 = toSearch1.search("nike");

			    			var toSearch2 = title.toLowerCase();
			    			toSearch2 = toSearch2.search("jordan");
			    			
			    			//var toSearch3 = title.toLowerCase();
			    			//toSearch3 = toSearch3.search("adidas");

			    			//console.log(title)
			    			//console.log(toSearch1, toSearch2, toSearch3)
			    			
			    			//if (toSearch1 != -1 || toSearch2 != -1 || toSearch3 != -1)
			    			if (toSearch1 != -1 || toSearch2 != -1){
			    				var apd = true;
			    			}
			    			else{
			    				var apd = false;
			    			}
			    			console.log(tmp)
			    			resolve([tmp, apd]);
		    			})
		    		}
	    		(async () => {
		    		const current_items = await new_item(current)
		    		if (current_items[1] == true){
		    			items.push(current_items[0]);
		    		}
		    	})();
	    	}
	    	resolve(items)})
	})
};

var writeOnFile = async(data, overwrite = false) => { 
	return await new Promise(async resolve => {
		try{
			if (overwrite){
				console.log('Overwriting......................')
				fs.writeFile ("oldsItems.json", JSON.stringify(data), function(err) {
			    if (err) throw err;
			    resolve(true);
				 })
			}
			else{
				if(fs.existsSync('oldsItems.json')){
					fs.appendFile('oldsItems.json', JSON.stringify(data), function (err) {
					  if (err) throw err;
					  resolve(true);
					});
				}
				else{
					console.log('Writing..........................')
					fs.writeFile ("oldsItems.json", JSON.stringify(data), function(err) {
				    if (err) throw err;
				    resolve(true);
					    }
					)}
			}
		}
		catch(err){
			console.log(('The file was not written........'))
		}

	})
};

var readFile = async() => { 
	return await new Promise(async resolve => {
		fs.readFile('oldsItems.json', 'utf8', function(err, data) {
		    if (err) throw err;
		    const array = JSON.parse(data);
		    resolve(array)
		})
	})
};

const getNotificationInfo = async(page) => {
    return page.evaluate(async () => { 
        return await new Promise(resolve => {
        	function sleep() {return new Promise(resolve => {console.log('Timer')})}
			try{
				var title = document.getElementsByTagName('title')[0].text;
				title = title.replace(/\n/g, '');
				title = title.replace(/\t/g, '');
	        	
	        	var price = document.getElementById('currentPrice').textContent;
	        	price = price.replace(/\n/g, '');
	        	price = price.replace(/ /g, '');
	        	
	        	var img_url = document.getElementsByClassName('slick-slide slick-current slick-active')[0].getElementsByTagName('img')[0].src;
			
				var get_sizes = document.getElementsByClassName('product-size__option'); 
				var on_stock = [];
				for (var i = 0; i < get_sizes.length; i ++) { 
					var get_class = get_sizes[i].getAttribute('class');  
					var soldout = get_class.search('no-stock');
					if (soldout != get_sizes[i]){
						var current = get_sizes[i].text
						current = current.replace(/\n\n\t/g, '');
						current = current.replace(/ /g, '');
						on_stock.push(current)
					} 
				}

	        	resolve([title, price, img_url, on_stock])
		}
		catch(err){
			console.log('The data from page was not loaded')
		}
		})

    })
};

const sendWeebhok = async (type, title, url, price, model, image_url, on_stock, notification = true, alert = false, err = false, cc = false) => {
	return await new Promise(resolve => {
	var WH_API = 'https://discord.com/api/webhooks/836808455279869973/HzaO4ewLNj2RaB5JwzGj1UVpFHkzVDCuQc6g8tAD3ly62j7rTwfcVxcP7I2fVfx0M-yy'
	var WH_API2 = 'https://discord.com/api/webhooks/836808651682480150/xvMLRhPlssKRVJp_K1jUb9tJBPFfdEK_yqEUYfXczICjXjmFeZAvY7WUZtPc1s8wkocg'
	const hook = new Webhook(WH_API);
	if (notification == true){ 
		const embed = new MessageBuilder()
			.setColor('#51f400')
			.setTitle(type)
			.setAuthor('Innbot')
			.addField('Model', title)
			.addField('Price', price)
			.addField('Link', url)
			.setThumbnail(image_url)
			.addField('Available sizes', on_stock)
			.setImage(image_url)
			.setFooter('by sneakerzoneMX')
			.setTimestamp();
			hook.send(embed);
		if (cc == true){
			const hook2 = new Webhook(WH_API2);
			const embed = new MessageBuilder()
				.setTitle(type)
				.setAuthor('Innbot')
				.addField('Model', title)
				.addField('Price', price)
				.addField('Link', url)
				.addField('Available sizes', on_stock)
				.setImage(image_url)
				.setFooter('by sneakerzoneMX', image_url)
				.setTimestamp();
			hook2.send(embed);
		} resolve(true)	
	}
	if (alert == true){ 
	const embed = new MessageBuilder()
			.setColor('#f4d800')
			.setTitle(type)
			.setURL('https://www.innvictus.com/p/'+model)
			.setAuthor('Innbot')
			.addField('TEST', 'alert test')
			.setFooter('by sneakerzoneMX')
			.setTimestamp();
		hook.send(embed);
		resolve(true)
	}
	if (err == true){ 
	const embed = new MessageBuilder()
			.setColor('#f40000')
			.setTitle(type)
			.setAuthor('Innbot')
			.addField('Error', 'Semething went wrong')
			.setFooter('by sneakerzoneMX')
			.setTimestamp();
		hook.send(embed);
		resolve(true)
	}
	})
};


// (async () => {
// 	var data = await readFile();
// 	var count = 0
// 	for (i = 0; i < data.length; i++){
// 		for (j = 0; j < data[i].length; j++){
// 			//console.log(data[i][j])
// 			count = count + 1;
// 		}
// 	 }
// 	 console.log(count)
// })();

(async () => {
	console.log('------------------------------------------------')
	try{
		var ini = Date.now()
		var browpage = await launchBrowser(true);
		var page = browpage[1]
		var url = 'https://www.innvictus.com/tenis-para-hombre/c/100010002000000000?q=%3Anewest%3Abrand%3AJ00000000000000000%3Abrand%3A100000690000000000'
		await page.goto(url)
		var pages = await pagesNumber(page)
		var current = [];
		var toCompare = [];
		var toCompareCurrent = [];
		var exist = false;

		for (i = 0; i < pages; i++){
			url_ = String(url+'&page='+i);
			await page.goto(url_)
			var items = await getCurrentPageItems(page)
			current.push(items)
			}
		browpage[0].close();
		var end = Date.now();
		var tt = end - ini; 
		console.log('Taked time---------------'+String(tt))
		if(fs.existsSync('oldsItems.json')){
			console.log('Comparing........................')
			var data = await readFile();
			for (i = 0; i < data.length; i++){
				for (j = 0; j < data[i].length; j++){
					toCompare.push(JSON.stringify(data[i][j]))
				}
		 	}
		 	var flag = false;
		 	for (i = 0; i < current.length; i++){
				for (j = 0; j < current[i].length; j++){
					var curr = JSON.stringify(current[i][j])
					if (!toCompare.includes(curr)){
						var flag = true;
					}
					if (flag){
						try{
							var browpage = await launchBrowser(true);
							var page = browpage[1]
							var curr_goto = JSON.parse(curr);
							var model = String(curr_goto['code']);
							await page.goto('https://www.innvictus.com/p/'+model)
							var getNI = await getNotificationInfo(page)
							const url = await page.url()
							var title = String(getNI[0]);
							var price = String(getNI[1]);
							var image_url = String(getNI[2]);
							var on_stock = String(getNI[3]);
							var status = await sendWeebhok('Notification', title, url, price, model, image_url, on_stock, true, false, false, false)
							if (status) {
								console.log('Notification succeed.............')
							}
							flag = false
							browpage[0].close()	
						}
						catch(err){
							console.log('Notification not succeed.........')
							flag = false
							browpage[0].close()	
						}	
					}
				}
		 	}
		var state = await writeOnFile(current, true)
		if (state == true){
			console.log('Done.............................')
			}
		}

		else{
			var state = await writeOnFile(current)
			if (state == true){
				console.log('Done.............................')
			}
		}
	}
	catch{
		await sendWeebhok('Error', '', '', '', '', '', '', false, false, true, false)
		console.log('Not Succeed......................')
	}

})();

