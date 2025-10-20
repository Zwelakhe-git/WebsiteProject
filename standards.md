##to ensure congruency in all our files please include the following containers in all .html files you create

***in \<head\> include the following scripts and styles***
``` html
<script type="text/javascript" src="/JS/base.js"></script>
<script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
<script src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" nomodule></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<script src="https://kit.fontawesome.com/6f0be4257f.js" crossorigin="anonymous"></script>
```

***In \<body\> at position 'afterbegin'***
``` html
<div id="top-bar" class="no-margin flxDisp">
    <div class="top-bar-container">
        <div id="logo">
        <img alt="logo" type="image/jpg" width="50" height="50" src="/media/images/Konektem.png"/>
    </div>
    <div id="top-bar-content" class="flxDisp full-h"></div>
  </div>
</div>
<div id="nav-panel" class="grey-clr no-ovrflw no-margin"></div>
```

## 2025-10-20
for the top bar only include the \<div id="top-bar" class="no-margin flxDisp"\>\<div\> container. do not put any footer and do not add styles for your top bar. they are already in a static file.
dont add a footer and dont add a nav panel for the page (concerning the shared nav panel)
