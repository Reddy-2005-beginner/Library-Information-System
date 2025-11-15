// Inject the animated blob sidebar into the page and run the animation
(function(){
  function createMenuHtml(){
    var div = document.createElement('div');
    div.id = 'menu';
    div.innerHTML = '\n      <div class="hamburger" role="button" aria-label="Open menu">\n        <div class="line"></div>\n        <div class="line"></div>\n        <div class="line"></div>\n      </div>\n      <div class="menu-inner">\n        <ul>\n          <li><a class="nav-link" href="/">Books</a></li>\n          <li><a class="nav-link" href="/reports.html">Reports</a></li>\n          <li><a class="nav-link" href="/policy.html">Policy</a></li>\n          <li><a class="nav-link" href="/users.html">Users</a></li>\n          <li style="padding-top:10px;color:#fff;font-weight:600">Categories</li>\n          <li style="padding:0;margin:0"><div id="categoryList" style="width:100%"></div></li>\n        </ul>\n      </div>\n      <svg version="1.1" id="blob" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n        <path id="blob-path" d="M60,500H0V0h60c0,0,20,172,20,250S60,900,60,500z"/>\n      </svg>\n    ';
    return div;
  }

  function setActiveLink(){
    var path = window.location.pathname || '/';
    var links = document.querySelectorAll('#menu .nav-link');
    links.forEach(function(a){
      a.classList.remove('active');
      try{ if (a.getAttribute('href')===path || (path==='/' && a.getAttribute('href')==='/')) a.classList.add('active'); }catch(e){}
    });
  }

  function initAnimation(){
    var height = window.innerHeight;
    var x = 0, y = height/2, curveX = 10, curveY = 0, targetX = 0;
    var xitteration = 0, yitteration = 0, menuExpanded = false;

    var blob = document.getElementById('blob');
    var blobPath = document.getElementById('blob-path');
    var hamburger = document.querySelector('.hamburger');
    var menu = document.getElementById('menu');
    var menuInner = document.querySelector('.menu-inner');

    window.addEventListener('mousemove', function(e){ x = e.pageX; y = e.pageY; });
    window.addEventListener('resize', function(){ height = window.innerHeight; });

  function addEnter(el){ if(!el) return; el.addEventListener('mouseenter', function(){ menu.classList.add('expanded'); menuExpanded = true; try{ document.body.classList.add('clerk-no-scroll'); }catch(e){} }); }
  function addLeave(el){ if(!el) return; el.addEventListener('mouseleave', function(){ menuExpanded = false; menu.classList.remove('expanded'); try{ document.body.classList.remove('clerk-no-scroll'); }catch(e){} }); }

    addEnter(hamburger);
    addEnter(menuInner);
    addLeave(menuInner);

    function easeOutExpo(currentIteration, startValue, changeInValue, totalIterations) {
      return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
    }

    var hoverZone = 150, expandAmount = 20;

    function svgCurve(){
      if ((curveX > x-1) && (curveX < x+1)) { xitteration = 0; } else {
        if (menuExpanded) { targetX = 0; } else {
          xitteration = 0;
          if (x > hoverZone) { targetX = 0; } else { targetX = -(((60+expandAmount)/100)*(x-hoverZone)); }
        }
        xitteration++;
      }

      if ((curveY > y-1) && (curveY < y+1)) { yitteration = 0; } else { yitteration = 0; yitteration++; }

      curveX = easeOutExpo(xitteration, curveX, targetX-curveX, 100);
      curveY = easeOutExpo(yitteration, curveY, y-curveY, 100);

      var anchorDistance = 200;
      var curviness = anchorDistance - 40;

      var newCurve2 = "M60,"+height+"H0V0h60v"+(curveY-anchorDistance)+"c0,"+curviness+","+curveX+","+curviness+","+curveX+","+anchorDistance+"S60,"+(curveY)+",60,"+(curveY+(anchorDistance*2))+"V"+height+"z";

      if (blobPath) blobPath.setAttribute('d', newCurve2);
      if (blob) blob.style.width = (curveX+60) + 'px';
      if (hamburger) hamburger.style.transform = 'translate('+curveX+'px, '+curveY+'px)';
      var h2 = document.querySelector('h2'); if(h2) h2.style.transform = 'translateY('+curveY+'px)';

      window.requestAnimationFrame(svgCurve);
    }

    window.requestAnimationFrame(svgCurve);
  }

  function injectMenu(){
    if(document.getElementById('menu')) return; // already present
    var menu = createMenuHtml();
    // insert as first child of body to ensure it's on the left
    document.body.insertBefore(menu, document.body.firstChild);
    setActiveLink();
    initAnimation();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectMenu);
  } else {
    injectMenu();
  }
})();
