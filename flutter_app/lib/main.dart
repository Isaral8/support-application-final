import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Support Application',
      home: Scaffold(
        appBar: AppBar(title: const Text('Support App')),
        body: const Center(
          child: Text('Project Setup Complete! ?'),
        ),
      ),
    );
  }
}
