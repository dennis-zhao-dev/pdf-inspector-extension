<script>alert(1)</script>
<img src="https://example.invalid/tracker" onerror="alert(2)">
[bad](javascript:alert(3))
[data](data:text/html,<script>alert(4)</script>)
<iframe srcdoc="<script>alert(5)</script>"></iframe>
<svg onload="alert(6)"></svg>
<div style="position:fixed">overlay</div>
