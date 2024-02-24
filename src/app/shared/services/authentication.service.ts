import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { UserService } from './user.service'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private isAuthenticated = false

  constructor(
    private userService: UserService,
    private http: HttpClient
  ) {
    this.checkAuthentication()
  }

  login(userInfo: any): void {
    const userData = {
      email: userInfo.email,
      username: userInfo.name,
      imageUrl: userInfo.picture
    }

    sessionStorage.setItem('loggedInUser', JSON.stringify(userData))
    this.isAuthenticated = true
    this.userService.updateUserProfile(userData)
    this.saveUserData(userData).subscribe(
      (response) => {
        console.log('User data saved', response)
      },
      (error) => {
        console.error('Error saving user data', error)
      }
    )
  }

  private checkAuthentication() {
    const user = sessionStorage.getItem('loggedInUser')
    if (user) {
      this.isAuthenticated = true
      const userData = JSON.parse(user)
      this.userService.updateUserProfile(userData)
    }
  }

  logout() {
    sessionStorage.removeItem('loggedInUser')
    this.isAuthenticated = false
    this.userService.clearUserProfile()
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated
  }

  //BACKEND COMMUNICATION
  saveUserData(userData: any): Observable<any> {
    return this.http.post('http://localhost:3000/users/new', userData)
  }
}
