# WebsiteProject

items seem to react differently width the width set at 100%.
the margin doesnt increase the size of the container. only the border and padding have an effect on it.
if the page is 414 wide and we set the container to 100% width, then the content-width of the container will be 414.
the offsetWidth accumulates from the padding, border and clientWidth(contentWidth).
adding a margin pushes the element in the given direction.

<h1>that is why we used this property to bring head below the top bar</h1>
however this can have some undesired effects. if you give it a margin left or right then we might get an overflow if the width is set to 100%.

it would be best to set up the width considering the margin of the element, and if possible the width of the whole page.
