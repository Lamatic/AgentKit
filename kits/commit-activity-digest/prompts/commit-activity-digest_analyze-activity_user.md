Generate an engineering activity digest from this git log output.

{{#if apiRequest.output.context}}
Context: {{apiRequest.output.context}}
{{/if}}

```
{{apiRequest.output.git_log}}
```
