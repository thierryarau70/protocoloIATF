<template>
  <FormLote :propriedade-id="$route.query.propriedade ? String($route.query.propriedade) : undefined" />
</template>
