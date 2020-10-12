const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const cssapply = require('postcss-apply');
const cssnested = require('postcss-nested');
const cssvariables = require('postcss-css-variables');
const custommedia = require('postcss-custom-media');
const autoprefixer = require('autoprefixer');
const uglifycss = require('uglifycss');
const babel = require('@babel/core');
const watch = require('node-watch');
var base64Img = require('base64-img');

const src = "assets/";
const dest = "dist/assets/";
const folders = ["img", "fonts"];

const isProd = process.argv[2] == "--prod" ? true : false;

var core = {
    modules: { css: [], js: [], html: [] },
    views: { css: [], js: [], html: [] },
    css: [],
    js: [],
    vendors: { css: [], js: [] },
    polyfills: { css: [], js: [] },
    initTime: new Date(),
    datas() {
		const files = core.dirScan(src);
		for(file of files){
			if (/\/vendor\//.test(file)) {
				if (/.css$/.test(file)) {
					core.css.push(file);
				}
				if (/.js$/.test(file)) {
					core.js.push(file);
				}
            }
            if (/\/polyfill\//.test(file)) {
				if (/.css$/.test(file)) {
					core.css.push(file);
				}
				if (/.js$/.test(file)) {
					core.js.push(file);
				}
            }
			if (/\/modules\//.test(file)) {
				if (/.html$/.test(file)) {
					core.modules.html.push(file);
				}
				if (/.css$/.test(file)) {
					core.modules.css.push(file);
				}
				if (/.js$/.test(file)) {
					core.modules.js.push(file);
				}
            }
            if (/\/views\//.test(file)) {
				if (/.html$/.test(file)) {
					core.views.html.push(file);
				}
				if (/.css$/.test(file)) {
					core.views.css.push(file);
				}
				if (/.js$/.test(file)) {
					core.views.js.push(file);
				}
			}
			if (/\/styles\//.test(file)) {
				if (/.css$/.test(file)) {			
					core.css.push(file);
				}
			}
		}
    },

    datas1() {
		const files = core.dirScan(src);
		for(file of files){
			if (/\/vendor\//.test(file)) {
                if (/.js$/.test(file)) {
                    core.js.push(file);
                }
            }
            if (/\/polyfill\//.test(file)) {
                if (/.js$/.test(file)) {
                    core.js.push(file);
                }
            }
            if (/\/modules\//.test(file)) {
                if (/.js$/.test(file)) {
                    core.modules.js.push(file);
                }
                if (/.css$/.test(file)) {
                    core.modules.css.push(file);
                }
            }
			if (/\/styles\//.test(file)) {
				if (/.css$/.test(file)) {			
					core.css.push(file);
				}
			}
		}
    },

    dirScan(dir) {
        var files = [];
        function recursive(dir) {
            var result = fs.readdirSync(dir);
            result.forEach(function (file) {
                file = path.resolve(dir, file);
                const stat = fs.statSync(file);
                if (stat && stat.isDirectory()) {
                    recursive(file);
                } else {
					files.push(file);
                }
            });
        }
        recursive(dir);
        return files;
	},
	
    rmDir(dirPath, removeSelf) {
        if (removeSelf === undefined)
            removeSelf = true;
        try { var files = fs.readdirSync(dirPath); }
        catch (e) { return; }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];

                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
                else
                    core.rmDir(filePath);
            }
        if (removeSelf)
            fs.rmdirSync(dirPath);
	},
    styles(files, dest) {
        var result = "";
        for (let file of files) {
            result += fs.readFileSync(file, 'utf8');
        }
        core.postcss(result, dest);
    },

    postcss(result, dest){
        var cleaner = postcss([cssapply, cssnested]);
        var prefixer = postcss([autoprefixer({add: true, browsers:["last 1 version"]})]);
        result = cleaner.process(result).css;
        result = prefixer.process(result).css;
        
        const minify = isProd ? uglifycss.processString(result) : result;
        fs.ensureDirSync(path.dirname(dest));
        fs.writeFileSync(dest, minify);
    },

    babel(result, dest){
        result = babel.transform(result, {
            minified: isProd ? true : false,
            comments: false,
            presets: [[
                "@babel/preset-env",{
                     corejs: 3,
                     useBuiltIns: "usage",
                }
               
            ]]
        }).code;
        fs.ensureDirSync(path.dirname(dest));
        fs.writeFileSync(dest, result);
    },

    postcss1(result){
        const cleaner = postcss([cssapply, cssnested, custommedia, cssvariables, autoprefixer({add: true, browsers:["last 2 versions"]})]);
        result = cleaner.process(result).css;
        return isProd ? uglifycss.processString(result) : result;
    },

    babel1(result){
        result = babel.transform(result, {
            minified: isProd ? true : false,
            comments: false,
            presets: [[
                "@babel/preset-env",
                {
                   
            
               }
            ]]
        }).code;
      
       return result;
    },

    font2base64(styles){
        function base64Encode(str) {
          var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var out = "", i = 0, len = str.length, c1, c2, c3;
          while (i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt((c1 & 0x3) << 4);
              out += "==";
              break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
              out += CHARS.charAt((c2 & 0xF) << 2);
              out += "=";
              break;
            }
            c3 = str.charCodeAt(i++);
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            out += CHARS.charAt(c3 & 0x3F);
          }
          return out;
        }
        function convert(url){
            const result = fs.readFileSync(url, 'binary');
            return "src: url(data:application/font-woff;base64,"+base64Encode(result)+")";
        }
        const regex = /src: url\(..\/(.*?)\)/g;
        return styles.replace(regex, (match, p1) => convert(p1));
    },


    styles1(){
        var styles = '';
        for(let file of [...core.css, ...core.modules.css, ...core.views.css ]){
            const result = fs.readFileSync(file, 'utf8');
            styles += result;   
        }
        styles = isProd ? core.font2base64(styles) : styles;
        assets.styles = `<style rel="stylesheet" type="text/css">${core.postcss1(styles)}</style>`;
    },
    scripts(){
        var scripts = "";
        core.js.push(__dirname+'/assets/app.js');
        for(let file of [...core.js]){
            console.log(file);
            const result = fs.readFileSync(file, 'utf8');
            scripts += core.babel1(result);
        }
        for(let module of core.views.js){
            const result = fs.readFileSync(module, 'utf8');
            scripts += core.babel1(result);
        }
        assets.scripts = `<script>${scripts}</script>`;
    },
    scripts1(){
        var scripts = "";
        core.js.push(__dirname+'/assets/app.js');
        for(let file of [...core.js]){
            const result = fs.readFileSync(file, 'utf8');
            scripts += result;
        }
        for(let module of core.modules.js){
            const result = fs.readFileSync(module, 'utf8');
            scripts += core.babel1(result);
        }
        for(let module of core.views.js){
            const result = fs.readFileSync(module, 'utf8');
            scripts += core.babel1(result);
        }
        assets.scripts = `<script>${scripts}</script>`;
    },

    views1(){
        for(file of core.dirScan("assets/views")){
            if (fs.statSync(file).isFile()){
                if (/.css/.test(file)) {
                    core.views.css.push(file);
                }
                if (/.js/.test(file)) {
                    core.views.js.push(file);
                }
            }
        }
    },
    export(){
        var result = fs.readFileSync('index.php', 'utf8');
        fs.writeFile("dist/index.html",  eval("`" + result + "`"), (err) => {
            if (err) throw err;
            console.log("ok!");
        }); 
    }, 
    export1(){
        var result = fs.readFileSync('index.php', 'utf8');
        fs.writeFile("export/index.html",  eval("`" + result + "`"), (err) => {
            if (err) throw err;
            console.log("The file was succesfully saved!");
        }); 
    }, 
    assets(){
        // styles
        core.styles([...core.css], dest + 'styles.css');

        // folders
        for (let folder of folders) {
            fs.copySync(src + folder, dest + folder);
        }

        // modules html
        for(let module of core.modules.html){
            const res = module.replace(__dirname + `/${src}`, '');
            fs.copySync(module, dest + res);
        }

    
        var scripts = "";

        // js
        core.js.push(__dirname+'/assets/app.js');
        for(let file of [...core.js]){
            const res = file.replace(__dirname + `/${src}`, '');	
            const result = fs.readFileSync(file, 'utf8');
            core.babel(result, dest+res);
            scripts += `
    <script src='assets/${res}'></script>`; 
        }


        // modules js
        for(let module of core.modules.js){
            const res = module.replace(__dirname + `/${src}`, '');	
            const result = fs.readFileSync(module, 'utf8');
            core.babel(result, dest+res);
            scripts += `
    <script src='assets/${res}'></script>`; 
        }
        

        // modules css
        var imports = "";
        for(let module of core.modules.css){
            const res = module.replace(__dirname + `/${src}`, '');
            const result = fs.readFileSync(module, 'utf8');
            core.postcss(result, dest+res);
            imports += `
        @import "assets/${res}";`;
        }

        // views js
        for(let view of core.views.js){
            const res = view.replace(__dirname + `/${src}`, '');	
            const result = fs.readFileSync(view, 'utf8');
            core.babel(result, dest+res);
            scripts += `
    <script src='assets/${res}'></script>`; 
        }
         
        // views css
       
        for(let view of core.views.css){
            const res = view.replace(__dirname + `/${src}`, '');
            const result = fs.readFileSync(view, 'utf8');
            core.postcss(result, dest+res);
            imports += `
        @import "assets/${res}";`;
        }
         
        assets.styles = `
    <style rel="stylesheet" type="text/css">
        @import "assets/styles.css";${imports}

    </style>`;
        assets.scripts = scripts;
    }

}

/* functions */
var includes = "";
const include = (literal, args) => {
    const result = fs.readFileSync(__dirname+`/assets/views/${literal}/index.html`, 'utf8');
   // includes += '@import "assets/views/'+literal+'/styles.css";';
    return  eval("`" + result + "`");
    
}

const base64 = (literal) => {
    const data = isProd ? base64Img.base64Sync(literal) : "../" + literal;
    return data;
}



/* start */

var assets = {}

core.datas1();
core.views1();
core.styles1();
core.scripts1();
core.export1();


//

/*
//assets.scripts = `<script>@import "assets/styles.css";</script>`;
core.datas();
core.rmDir(dest);
core.assets();
core.export();
*/
