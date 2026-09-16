<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="{{ config('app.name', 'SPMB JABAR') }} — SPMB Terintegrasi">
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" type="image/png" href="{{ asset('images/disdik-jabar.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('images/disdik-jabar.png') }}">
        <title inertia>{{ config('app.name', 'SPMB JABAR') }}</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>